# ============================================================
# Module: cloudfront
#
# 構成:
#   - CloudFront ディストリビューション（HTTPS 終端）
#   - オリジン: ECS web タスクの Public IP（scripts/update-cloudfront-origin.sh で自動更新）
#   - Origin Shield: カスタムヘッダー X-CF-Origin-Secret を付与（将来の Next.js middleware 検証用に維持）
#   - キャッシュポリシー:
#     - /_next/static/*: 長期キャッシュ（イミュータブルアセット）
#     - /*: デフォルト（TTL 0、SSR レスポンス対応）
#
# /api/* behavior を廃止した理由:
#   全 API 通信を Next.js サーバーサイドに集約（localhost:5000 への直接呼び出し）。
#   ブラウザから /api/* を直接叩かなくなったため専用 behavior は不要。
#
# ALB を使わない理由:
#   ALB は月 $16〜 かかるため、CloudFront → ECS Public IP の直接接続で代替。
#   IP は ECS タスク再起動のたびに変わるため、デプロイパイプラインで自動更新する。
# ============================================================

# SSM から Origin Shield シークレットを取得
data "aws_ssm_parameter" "cf_origin_secret" {
  name            = var.origin_shield_secret_ssm_path
  with_decryption = true
}

locals {
  origin_id = "${var.name_prefix}-web-origin"
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.name_prefix} — ALBレス CloudFront 直接配信"
  price_class         = var.price_class
  default_root_object = ""

  # ─── オリジン設定 ────────────────────────────────────────────────────────────
  origin {
    origin_id   = local.origin_id
    domain_name = var.web_origin_domain

    custom_origin_config {
      http_port              = 3000
      https_port             = 443
      origin_protocol_policy = "http-only" # ECS タスクへは HTTP で接続（CloudFront が HTTPS 終端）
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # Origin Shield: Next.js middleware での直接アクセス検証用（将来利用）
    custom_header {
      name  = "X-CF-Origin-Secret"
      value = data.aws_ssm_parameter.cf_origin_secret.value
    }
  }

  # ─── デフォルトキャッシュ（SSR ページ） ───────────────────────────────────────
  default_cache_behavior {
    target_origin_id       = local.origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      # SSR: クエリパラメータ・Cookie をオリジンに転送
      query_string = true
      cookies {
        forward = "all"
      }
      headers = ["Host", "CloudFront-Forwarded-Proto"]
    }

    # SSR レスポンスはキャッシュしない（TTL = 0）
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # ─── /_next/static/*: 長期キャッシュ（イミュータブル） ───────────────────────
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = local.origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    # Next.js static assets はコンテンツハッシュ付きのため長期キャッシュ可能
    min_ttl     = 0
    default_ttl = 86400    # 1日
    max_ttl     = 31536000 # 1年
  }

  # ─── HTTPS 設定 ───────────────────────────────────────────────────────────────
  dynamic "viewer_certificate" {
    for_each = var.acm_certificate_arn != null ? [1] : []
    content {
      acm_certificate_arn      = var.acm_certificate_arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2021"
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.acm_certificate_arn == null ? [1] : []
    content {
      # ACM 証明書なしの場合は CloudFront デフォルト証明書（*.cloudfront.net）を使用
      cloudfront_default_certificate = true
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
