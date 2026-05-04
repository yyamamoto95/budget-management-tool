# ============================================================
# Module: ecs
#
# 構成:
#   1. ECS クラスター（Fargate、Container Insights 無効で無料枠維持）
#   2. CloudWatch ロググループ（web / api 各サービス用）
#   3. ECS タスク定義（web / api）
#      - 0.25 vCPU / 512MB（無料枠 750h/月）
#      - 環境変数は SSM Parameter Store から注入（ハードコード禁止）
#   4. ECS サービス（web / api）
#      - Fargate、パブリックサブネット直接配置（NAT GW 不要）
#      - desired_count = 1（停止時は 0 に変更して無料枠節約可）
#
# 禁止事項:
#   - タスク定義への DATABASE_URL 等の直書き
#   - ALB / NAT Gateway の使用
# ============================================================

# ─── ECS クラスター ───────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  setting {
    # Container Insights は有料のため無効化
    name  = "containerInsights"
    value = "disabled"
  }
}

# ─── CloudWatch ロググループ ──────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.name_prefix}/web"
  retention_in_days = 7 # 無料枠 5GB/月 を超えないよう短期保持
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.name_prefix}/api"
  retention_in_days = 7
}

# ─── タスク定義: web (サイドカー構成: web + api を同一タスクで起動) ──────────
#
# web と api を同一 Fargate タスクに同居させ、localhost で通信する。
# - web (Next.js)  : port 3000 — CloudFront がオリジンとして参照
# - api (Hono)     : port 5000 — web から http://localhost:5000 で呼び出す（タスク内部通信）
#
# deploy.yml の deploy-ecs ジョブが CI/CD でイメージを差し替えるため、
# lifecycle.ignore_changes = [task_definition] で Terraform 側の上書きを防ぐ。

resource "aws_ecs_task_definition" "web" {
  family                   = "${var.name_prefix}-web"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.task_execution_role_arn

  container_definitions = jsonencode([
    # ─ index 0: web (Next.js) ─────────────────────────────────────────────
    {
      name      = "web"
      image     = var.web_image
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "INTERNAL_API_URL"
          value = "http://localhost:5000"
        }
      ]

      # middleware.ts が JWT_PUBLIC_KEY を使ってアクセストークンを検証するため注入
      secrets = [
        {
          name      = "JWT_PUBLIC_KEY"
          valueFrom = "${var.ssm_prefix}/jwt_public_key"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.web.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        # curl -sf: -s(silent) -f(fail on HTTP error)
        # Next.js 16 standalone は HOSTNAME=0.0.0.0 でもコンテナ実 IP (eth0) にのみ bind するため、
        # 127.0.0.1 では接続不可。hostname -i でコンテナの実 IP を取得して使用する。
        command     = ["CMD-SHELL", "curl -sf http://$(hostname -i):3000/health"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }
    },

    # ─ index 1: api (Hono) ────────────────────────────────────────────────
    {
      name      = "api"
      image     = var.api_image
      essential = true

      portMappings = [
        {
          containerPort = 5000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "5000"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.ssm_prefix}/database_url"
        },
        {
          name      = "JWT_PRIVATE_KEY"
          valueFrom = "${var.ssm_prefix}/jwt_private_key"
        },
        {
          name      = "JWT_PUBLIC_KEY"
          valueFrom = "${var.ssm_prefix}/jwt_public_key"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.api.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD", "node", "-e", "require('http').get({host:'127.0.0.1',port:5000,path:'/api/health'},(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

# ─── タスク定義: api ─────────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.name_prefix}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.task_execution_role_arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = var.api_image
      essential = true

      portMappings = [
        {
          containerPort = 5000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "5000"
        }
      ]

      # SSM から DATABASE_URL 等のシークレットを注入（ハードコード禁止）
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.ssm_prefix}/database_url"
        },
        {
          name      = "JWT_PRIVATE_KEY"
          valueFrom = "${var.ssm_prefix}/jwt_private_key"
        },
        {
          name      = "JWT_PUBLIC_KEY"
          valueFrom = "${var.ssm_prefix}/jwt_public_key"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.api.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD", "node", "-e", "require('http').get({host:'127.0.0.1',port:5000,path:'/api/health'},(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

# ─── ECS サービス: web ───────────────────────────────────────────────────────

resource "aws_ecs_service" "web" {
  name            = "${var.name_prefix}-web"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets = var.subnet_ids
    security_groups = [
      var.web_sg_id, # CloudFront → Next.js (port 3000) の受け入れ
      var.api_sg_id, # サイドカー api → RDS (port 3306) のアクセス許可
      # sg-rds は sg-api からの接続のみ許可するため、web サービスにも sg-api が必要
    ]
    # NAT GW なしで ECR / SSM へアクセスするためパブリック IP を付与
    assign_public_ip = true
  }

  # タスク定義の変更はデプロイパイプラインが管理するため、Terraform では無視
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
}

# ─── ECS サービス: api ───────────────────────────────────────────────────────

resource "aws_ecs_service" "api" {
  name            = "${var.name_prefix}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.api_sg_id]
    assign_public_ip = true
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
}
