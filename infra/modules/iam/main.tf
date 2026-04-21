# ============================================================
# Module: iam
#
# 構成:
#   1. GitHub Actions OIDC ID プロバイダー
#      → 永続的アクセスキー不要のキーレス認証
#   2. GitHubActionsRole
#      → main ブランチからのみ AssumeRoleWithWebIdentity を許可
#      → ECR Push / ECS デプロイ / SSM 読取 の最小権限
#   3. EcsTaskExecutionRole
#      → コンテナ起動に必要な標準権限 + SSM Parameter Store 読取
#
# 禁止事項:
#   aws_iam_access_key の発行は行わない（OIDC で代替）
# ============================================================

data "aws_caller_identity" "current" {}

locals {
  account_id       = data.aws_caller_identity.current.account_id
  github_oidc_url  = "https://token.actions.githubusercontent.com"
  ecr_resource_arn = "arn:aws:ecr:${var.aws_region}:${local.account_id}:repository/${var.name_prefix}-*"
  # ssm_prefix は "/budget/dev" 形式（先頭スラッシュあり）のため parameter と直接結合する
  # 例: parameter/budget/dev/* → arn:aws:ssm:...:parameter/budget/dev/*
  ssm_resource_arn = "arn:aws:ssm:${var.aws_region}:${local.account_id}:parameter${var.ssm_prefix}/*"
}

# ─── GitHub Actions OIDC ID プロバイダー ────────────────────────────────────

resource "aws_iam_openid_connect_provider" "github" {
  url             = local.github_oidc_url
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = var.github_thumbprints
}

# ─── GitHubActionsRole ────────────────────────────────────────────────────────

resource "aws_iam_role" "github_actions" {
  name        = "${var.name_prefix}-github-actions-role"
  description = "GitHub Actions OIDC role. Allows ECR Push, ECS Deploy, and SSM Read only."

  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    # aud: GitHub が STS に送るオーディエンス
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # sub: main ブランチからの push のみを許可
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role_policy" "github_actions" {
  name   = "${var.name_prefix}-github-actions-policy"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.github_actions_policy.json
}

data "aws_iam_policy_document" "github_actions_policy" {
  # ECR: 認証トークン取得（全リポジトリ対象、リソース指定不可）
  statement {
    sid       = "ECRAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  # ECR: budget-* リポジトリへのイメージ Push / Pull
  statement {
    sid    = "ECRPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [local.ecr_resource_arn]
  }

  # ECS: タスク定義更新・サービス更新・マイグレーションタスク実行
  statement {
    sid    = "ECSDeployDescribe"
    effect = "Allow"
    actions = [
      "ecs:RegisterTaskDefinition",
      "ecs:UpdateService",
      "ecs:DescribeServices",
      "ecs:DescribeTaskDefinition",
      "ecs:ListTaskDefinitions",
      "ecs:ListClusters",
      "ecs:RunTask",       # DB マイグレーション用 ECS Run Task
      "ecs:DescribeTasks", # マイグレーションタスクの完了確認・CloudFront 更新時の IP 取得
      "ecs:ListTasks",     # CloudFront 更新時のタスク一覧取得
    ]
    resources = ["*"]
  }

  # ECS: タスク定義へ EcsTaskExecutionRole を渡す権限
  statement {
    sid     = "ECSPassRole"
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      aws_iam_role.ecs_task_execution.arn,
    ]
    condition {
      test     = "StringLike"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }

  # EC2: ECS タスクの ENI から Public IP を取得（CloudFront オリジン更新に必要）
  statement {
    sid    = "EC2DescribeENI"
    effect = "Allow"
    actions = [
      "ec2:DescribeNetworkInterfaces",
    ]
    resources = ["*"]
  }

  # CloudFront: オリジン更新・キャッシュ無効化
  statement {
    sid    = "CloudFrontUpdate"
    effect = "Allow"
    actions = [
      "cloudfront:GetDistributionConfig",
      "cloudfront:UpdateDistribution",
      "cloudfront:CreateInvalidation",
    ]
    resources = ["*"]
  }

  # SSM Parameter Store: アプリ設定の読取（シークレット含む）
  statement {
    sid    = "SSMRead"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]
    resources = [local.ssm_resource_arn]
  }

  # CloudWatch Logs: マイグレーション実行ログの読取（GitHub Actions でのデバッグ用）
  # ECS タスクのログを GitHub Actions 上に表示することで、失敗原因の調査を完結させる
  statement {
    sid    = "CloudWatchLogsRead"
    effect = "Allow"
    actions = [
      "logs:GetLogEvents",
    ]
    # ログストリーム ARN: arn:aws:logs:region:account:log-group:name:log-stream:stream-name
    resources = [
      "arn:aws:logs:${var.aws_region}:${local.account_id}:log-group:/ecs/${var.name_prefix}/*:log-stream:*",
    ]
  }
}

# ─── EcsTaskExecutionRole ────────────────────────────────────────────────────

resource "aws_iam_role" "ecs_task_execution" {
  name        = "${var.name_prefix}-ecs-task-execution-role"
  description = "ECS task execution role. Allows ECR Pull and CloudWatch Logs write on container startup."

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# ECR Pull + CloudWatch Logs: AWS 管理ポリシーで付与
resource "aws_iam_role_policy_attachment" "ecs_task_execution_managed" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# SSM Parameter Store: アプリ起動時に環境変数としてシークレットを注入
resource "aws_iam_role_policy" "ecs_task_execution_ssm" {
  name   = "${var.name_prefix}-ecs-ssm-read-policy"
  role   = aws_iam_role.ecs_task_execution.id
  policy = data.aws_iam_policy_document.ecs_ssm_policy.json
}

data "aws_iam_policy_document" "ecs_ssm_policy" {
  statement {
    sid    = "SSMReadForTaskEnv"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]
    resources = [local.ssm_resource_arn]
  }
}

# ─── Layer 4: RDS IAM データベース認証 ───────────────────────────────────────
# rds_resource_id が指定された場合のみ rds-db:connect 権限を付与する。
# パスワード認証を廃止し、IAM 認証トークン（15分有効）で接続することで
# 静的パスワードの漏洩リスクを排除する。
#
# アプリケーション側の対応（apps/api）:
#   aws-sdk の RDS.Signer で generateAuthToken() を実行し、
#   Prisma の DATABASE_URL のパスワード部分に動的トークンを設定する。
#   （RDS インスタンス作成後に実装予定）

resource "aws_iam_role_policy" "ecs_task_rds_iam_auth" {
  count  = var.rds_resource_id != "" ? 1 : 0
  name   = "${var.name_prefix}-ecs-rds-iam-auth-policy"
  role   = aws_iam_role.ecs_task_execution.id
  policy = data.aws_iam_policy_document.ecs_rds_iam_auth_policy[0].json
}

data "aws_iam_policy_document" "ecs_rds_iam_auth_policy" {
  count = var.rds_resource_id != "" ? 1 : 0

  statement {
    sid    = "RDSIAMConnect"
    effect = "Allow"
    actions = [
      "rds-db:connect",
    ]
    # リソース形式: arn:aws:rds-db:{region}:{account}:dbuser:{resource-id}/{db-user}
    resources = [
      "arn:aws:rds-db:${var.aws_region}:${local.account_id}:dbuser:${var.rds_resource_id}/api",
    ]
  }
}
