# プロジェクト概要

**このファイルは `.github/` SSOT の一部である。すべての AI エージェントはこのファイルを参照すること。**

---

## プロダクト

**家計が苦しい家庭（主婦層）が、数字を見て動けるようになる家計管理ツール。**

記録するたびに「家計の寿命」が変わる即時フィードバックで継続動機を作り、支出を抑える行動変容を促す。
お金を使わせず、アプリを使わせることがビジネス方針。モノリポジトリ構成。

詳細: `.github/product-identity.md`

### 3つの機能軸

1. **即時フィードバック** — 入力するたびに「あと何ヶ月」が更新される
2. **客観的な比較** — 統計データとの対比でカテゴリ別の支出水準を偏差値で示す
3. **継続設計** — 支出ゼロ日の連続カウントなど、記録を習慣化させる仕組み

---

## ディレクトリ構造

```
.
├── apps
│   ├── api/          … Hono バックエンド API（DDD / Onion Architecture）
│   ├── web/          … Next.js フロントエンド（App Router）。詳細は apps/web/AGENTS.md
│   └── sandbox/      … UI/UX プロトタイプ検証環境。詳細は apps/sandbox/AGENTS.md
├── packages
│   ├── common/       … FE/BE 共用の型定義・Zod スキーマ・ユーティリティ
│   ├── api-spec/     … OpenAPI スペック（openapi.yaml）
│   └── api-client/   … OpenAPI から自動生成した型安全 API クライアント
├── docs
│   └── database/     … DB スキーマ定義（schema.dbml）— ツール連携のためここに置く
├── .github/          … 全規約・プロセス定義・スプリント管理の SSOT
├── mysql/            … MySQL 設定・初期化 SQL
├── e2e/              … Playwright E2E テスト
└── infra/            … インフラ定義
```

---

## 命名規則（ユビキタス言語）

| 概念 | 使用する名前 | 備考 |
|------|------------|------|
| 支出 | `Expense` | |
| 収入 | `Income` | |
| 予算/一括呼称 | 使用禁止（`Budget`） | 混乱を避けるためビジネスロジック内では原則禁止。既存の `budget_list` テーブルは `Expense` の永続化先として扱う |
| ID | `ulid` | |

---

## 技術スタック

| 区分 | 技術 |
|------|------|
| Runtime | Node.js / TypeScript |
| Package Manager | pnpm (Workspaces) |
| FE | Next.js（App Router）|
| BE | Hono + Prisma（DDD / Onion Architecture）|
| DB | MySQL 8.0（Prisma マイグレーション）|
| テスト | Vitest / RTL / Playwright |
| CI | GitHub Actions |
| IaC | Turborepo |
