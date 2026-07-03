# 運用ガイド（鍵管理・DB マイグレーション）

---

## 1. JWT 鍵（RS256）

```bash
pnpm gen:keys                 # RSA 鍵ペアを生成して .env に追記
echo 'JWT_PUBLIC_KEY="..."' >> apps/web/.env.local   # 公開鍵を Next.js 側にも設定
```

- 秘密鍵（`JWT_PRIVATE_KEY`）は **API サーバーのみ**。公開鍵は API と Next.js の両方
- 鍵ローテーション時は新鍵ペアを生成して両者を差し替え、全ユーザーの再ログインが必要になる旨をリリースノートに記載する
- 鍵・トークンをログ・クライアントコードに出力しない（設計の経緯は `.github/arch/auth-decision-log.md`）

## 2. DB マイグレーション

**SSOT は `apps/api/prisma/schema.prisma`。migration.sql の手書き・DBML の手動編集は禁止。**

| 環境 | コマンド | 備考 |
|------|---------|------|
| ローカル開発 | `pnpm db:migrate:dev --name <説明>` | shadow DB を使い SQL を自動生成・適用・`prisma generate` まで実行 |
| 本番 / CI | `pnpm db:migrate:deploy` | 既存 migration.sql を適用するのみ（SQL 生成しない） |
| スキーマ変更後 | `pnpm db:docs` | `docs/database/schema.dbml` を再生成 |

> 本番相当の DB ユーザーに `CREATE DATABASE` 権限がない環境では `migrate dev`（shadow DB 必須）は実行できない。マイグレーション生成は必ずローカルで行い、本番には `migrate deploy` のみを使う。

### 失敗時のリカバリ

| 状況 | 対応 |
|------|------|
| failed 状態のマイグレーション | `pnpm exec prisma migrate resolve --rolled-back <migration_name>` でロールバック済みにマークして再実行 |
| 部分適用されたテーブル | 手動 DROP 後に `pnpm db:migrate:deploy` |

## 3. Seed・ゲストユーザー

```bash
pnpm --filter @budget/api run seed   # 冪等。CI の E2E ジョブでも実行される
```
