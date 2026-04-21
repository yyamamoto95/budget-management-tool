terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project = var.project
      # var.env が環境識別子（dev / stg / prod）の単一の起点。
      # prod 環境を立ち上げた場合、このタグ値が変わるだけで全リソースに伝播する。
      Environment = var.env
      ManagedBy   = "terraform"
      Owner       = "yamamoto-yudai"
      # AWS myApplications ダッシュボードとの連携用タグ。
      # 環境ごとに一意のアプリケーション識別子を付与し、コスト・セキュリティ分析を環境単位で行う。
      awsApplication = "budget-app-${var.env}"
    }
  }
}
