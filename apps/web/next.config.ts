import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // コンテナデプロイ用: standalone モードで最小ランタイムを出力
  output: "standalone",

  // 開発時のみ: cloudflared 等のトンネル越し実機確認で dev アセットの
  // クロスオリジン読み込みを許可する（本番ビルドには影響しない）
  allowedDevOrigins: ["*.trycloudflare.com"],

  experimental: {
    serverActions: {
      // レシート画像（最大約7MB）を Server Action で受けるため既定の 1MB から拡大（#521）
      bodySizeLimit: "8mb",
    },
  },

  // ─── Layer 3: セキュリティヘッダー ─────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS: HTTPS を強制（max-age=1年、サブドメイン含む）
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // クリックジャッキング対策
          { key: "X-Frame-Options", value: "DENY" },
          // MIME スニッフィング対策
          { key: "X-Content-Type-Options", value: "nosniff" },
          // リファラー情報の最小化
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 強力な CSP（インラインスクリプト不要な範囲で制限）
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
