# ============================================================
# apps/web/Dockerfile — Next.js (standalone) マルチステージビルド
#
# ステージ:
#   1. base    — pnpm セットアップ
#   2. deps    — 依存関係インストール（workspace 対応）
#   3. builder — Next.js ビルド（standalone 出力）
#   4. runner  — 最小ランタイムイメージ
# ============================================================

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# ─── deps: workspace の依存関係をインストール ────────────────────────────────
FROM base AS deps
WORKDIR /repo

# pnpm workspace 解決に必要なファイルを先にコピーしてキャッシュを活用
# apps/api を含めるのは web が apps/api/src を直接型インポートするため
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/common/package.json ./packages/common/
COPY packages/api-client/package.json ./packages/api-client/

# --ignore-scripts: Docker コンテナに git がないため lefthook install (prepare スクリプト) をスキップ
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── builder: Next.js ビルド ──────────────────────────────────────────────────
FROM base AS builder
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
# apps/api/node_modules は web が apps/api/src を直接型インポートするため必要
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages/common/node_modules ./packages/common/node_modules
COPY --from=deps /repo/packages/api-client/node_modules ./packages/api-client/node_modules

# ソースをコピー
COPY packages/common ./packages/common
COPY packages/api-client ./packages/api-client
# TypeScript の型解決に必要（web → apps/api/src への直接 import type）
COPY apps/api/src ./apps/api/src
COPY apps/web ./apps/web
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# common / api-client をビルド（web が依存）
RUN pnpm --filter @budget/common build
RUN pnpm --filter @budget/api-client build

# Next.js ビルド
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

# ─── runner: 最小ランタイム ───────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# curl: ECS ヘルスチェック用（wget は Alpine で IPv6 解決問題が生じる場合があるため curl を使用）
RUN apk add --no-cache curl

# セキュリティ: 非 root ユーザーで実行
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 出力をコピー
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
