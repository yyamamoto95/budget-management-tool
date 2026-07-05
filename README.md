# 家計管理ツール

**「記録するだけの家計簿から、生活余力をのばす道具へ」**

今の資産で「生活費あと何ヶ月分あるか（生活余力）」を数字で示し、ユーザーの決断をサポートする家計管理ツール。

> プロダクト詳細: [.github/spec/product.md](.github/spec/product.md)

---

ローカル開発は `pnpm` + `Turborepo` + `Docker（MySQL）` で完結します。

## 前提条件

- Node.js 20 以上
- pnpm 10 以上
- Docker / Docker Desktop

## クイックスタート

```bash
# 1. 依存関係・DB・マイグレーションを一括セットアップ（初回のみ）
pnpm setup

# 2. 全スタックを起動
pnpm dev
```

> `pnpm setup` は以下を自動で行います: 依存関係のインストール / `.env` の生成 / DB 起動と healthcheck 待機 / マイグレーション実行

### 特定パッケージのみ起動する場合

```bash
# API のみ
pnpm dev:api

# Web のみ
pnpm dev:web

# turbo フィルタを直接指定（turbo の --filter 構文）
pnpm dev -- --filter @budget/api
```

### 起動先の URL

- フロント（Next.js）: `http://localhost:3000`
- API（Express）: `http://localhost:3001`
- サンドボックス（Vite）: `http://localhost:5173`
- MySQL: `localhost:3306`

## 環境変数の設定

`.env.example` をコピーして `.env` を作成してください。

```bash
cp .env.example .env
```

主な変数の意味:

- `DB_HOSTNAME` … 接続先ホスト（例: `127.0.0.1`）
- `DB_PORT` … ポート（例: `3306`）
- `DB_NAME` … データベース名
- `DB_USER` … DB ユーザー名
- `DB_PASSWORD` … DB パスワード
- `JWT_PRIVATE_KEY` … RS256 署名用秘密鍵（改行を `\n` に変換したシングルライン形式）
- `JWT_PUBLIC_KEY` … RS256 検証用公開鍵（同上）
- `TZ` … タイムゾーン

### RSA 鍵ペアの生成

JWT RS256 認証には RSA 鍵ペアが必要です。以下のコマンドで生成し、`.env` に自動で追記されます（初回のみ）。

```bash
pnpm gen:keys
```

生成された `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` の値を `apps/web/.env.local` にも設定してください（Next.js のサーバーサイドでトークン検証に使用）。

```bash
# apps/web/.env.local（git 管理対象外）
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

## Docker Compose（MySQL 8.0）

`docker-compose.yml` で `db` サービスとして MySQL 8.0 を定義しています。

- 公開ポート: `3306:3306`
- データ永続化: `mysql-data-volume`
- MySQL 設定ファイル: `./mysql/my.cnf`
- 初回起動時に流す SQL のマウント先: `./mysql/init` → コンテナ内 `/docker-entrypoint-initdb.d`
- healthcheck: DB が完全に起動するまで `mysqladmin ping` で待機（最大 90 秒）

初期化用の SQL は `mysql/init/` に置いてください（**初回コンテナ作成時のみ**実行されます）。

テスト用 DB（port 3307）は `docker-compose.test.yml` で管理しています。tmpfs を使用するため、コンテナ停止時にデータは消去されます。

## API 起動時の DB 待機

`apps/api` では、DB のポートが応答するまで `wait-on` で待ってから起動します。

- 定義場所: `apps/api/package.json` の `dev` スクリプト
- 内容のイメージ: `wait-on tcp:${DB_HOSTNAME:-127.0.0.1}:${DB_PORT:-3306}` のあとに `ts-node` で API を起動

## ディレクトリ構成の目安

```text
.
├── apps
│   ├── api          … Hono + TypeORM（バックエンド API）
│   ├── web          … Next.js（App Router）
│   └── sandbox      … Vite + React + TypeScript（移行検証用）
├── packages
│   ├── common       … FE/BE 共用の型定義・Zod スキーマ
│   ├── api-spec     … 生成された OpenAPI スペック（openapi.yaml）
│   └── api-client   … 生成された API 型定義（schema.d.ts）
├── docs
│   └── database     … DB スキーマ定義（schema.dbml）— ツール連携のためここに配置
├── .github          … 全規約・プロセス定義・スプリント管理の SSOT
├── mysql
│   ├── init         … 初回 DB 初期化用 SQL
│   └── my.cnf       … MySQL 設定
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

## テスト

### テスト構成（テストピラミッド）

```
          ┌──────────────────────┐
          │   E2E（Playwright）  │  ← ブラウザ操作を伴うユーザー操作全行程
          ├──────────────────────┤
          │  統合テスト（実 DB） │  ← Supertest + TypeORM（API ↔ DB 貫通）
          ├──────────────────────┤
          │   API テスト（モック）│  ← Supertest + コントローラモック
          ├──────────────────────┤
          │ ユニット・コンポーネント │ ← Vitest / RTL（モック）
          └──────────────────────┘
```

| レイヤー | コマンド | 実行時間の目安 | DB 要否 |
|---|---|---|---|
| ユニット・コンポーネント | `pnpm test:unit` | ~2 秒 | 不要 |
| API テスト（モック） | `pnpm test:api` | ~1 秒 | 不要 |
| 統合テスト（実 DB） | `pnpm test:integration` | ~3 秒 | **必要** |
| E2E（Playwright） | `pnpm test:e2e` | 数十秒 | **必要**（FE+BE 起動） |

### 1. ユニット・コンポーネントテスト（DB 不要）

```bash
# 全パッケージ一括実行
pnpm test:unit

# パッケージ個別実行
pnpm --filter @budget/common run test:unit   # Zod スキーマ UT
pnpm --filter @budget/api run test:unit      # コントローラ UT
pnpm --filter web run test:unit              # React コンポーネント UT
```

### 2. API テスト（モック・DB 不要）

```bash
pnpm test:api
```

### 3. 統合テスト（実 DB を使用）

統合テストはテスト専用の隔離された MySQL インスタンス（port **3307**）を使用します。

**手順 1: テスト用 DB を起動する**

```bash
docker compose -f docker-compose.test.yml up -d
```

> `docker-compose.test.yml` は tmpfs（揮発ストレージ）を使用するため、コンテナ停止時にデータは消去されます。開発用 DB（port 3306）とは完全に独立しています。

**手順 2: DB の起動完了を確認する**

```bash
docker compose -f docker-compose.test.yml ps
# STATUS が "(healthy)" になるまで待つ（約 10 秒）
```

**手順 3: 統合テストを実行する**

```bash
pnpm test:integration
```

**手順 4: テスト後に DB を停止する（任意）**

```bash
docker compose -f docker-compose.test.yml down
```

#### 冪等性の仕組み

統合テストは以下の仕組みで各テストケースの独立性を保証しています。

| 仕組み | 説明 |
|---|---|
| `resetDatabase()` | `beforeEach` で全テーブルを TRUNCATE し、真っさらな状態から開始 |
| `seedTestData({ pattern })` | シナリオに応じたテストデータを `ulid()` で動的 ID を生成して投入 |
| `fileParallelism: false` | テストファイル間の DB 状態競合を防ぐため並列実行を無効化 |

#### シードパターン一覧

| パターン | 再現シナリオ |
|---|---|
| `minimal` | ログイン確認用の最小構成（ユーザー 1 件のみ） |
| `lastMonthHeavyUser` | 前月に大量の経費を申請し、今月初めてログインしたユーザー（支出 15 件 + 収入 1 件） |
| `managerUser` | 複数プロジェクトを跨いで経費を管理する管理職ユーザー（今月・先月・複数カテゴリ） |
| `edgeCases` | 最小金額（1 円）・未来日付・250 文字の備考欄・content null を含む実運用イレギュラーデータ |

### 4. verify-flow.sh（コミット前全検証）

```bash
bash .claude/hooks/verify-flow.sh
```

実行順序: **type-check → test:unit → test:api → test:integration（DB 起動時のみ）→ build**

- テスト DB（port 3307）が未起動の場合、統合テストは自動スキップされます
- いずれかのステップが失敗すると即座に中断し、コミットをブロックします

### 5. E2E テスト（Playwright）

```bash
# FE（port 3000）と BE（port 3001）を先に起動してから実行
pnpm test:e2e
```

> E2E テストの詳細は `e2e/` ディレクトリを参照してください。

### 6. Lefthook による自動実行タイミング

| フック | 実行内容 | 条件 |
|--------|---------|------|
| `pre-commit` | type-check / lint / format / openapi-sync / design-tokens-sync / **unit-test** | 常時 |
| `pre-push` | **統合テスト** | テスト用 DB（port 3307）が起動中のみ |

---

### テスト追加ガイドライン（新規コード時の必須事項）

新規コードを追加・既存コードを修正する際は、以下を基準にテストを作成してください。**テストなしの実装はマージしません。**

#### テスト配置マップ

```
apps/
  web/src/__tests__/
    components/   ← コンポーネント・hooks（Vitest + RTL）
    actions/      ← Server Actions（Vitest）
  api/src/__tests__/
    unit/         ← UseCase・ドメインロジック（Vitest）
    integration/  ← API エンドポイント（Supertest + 実 DB）
    e2e/          ← API 全行程（Supertest）
packages/
  common/src/__tests__/
    schemas/      ← Zod スキーマ（Vitest）
e2e/              ← ブラウザ操作全行程（Playwright）
```

#### 必須テストケース

| 区分 | 内容 |
|------|------|
| **正常系** | 想定入力で想定出力が返ること |
| **異常系** | 不正入力・エラー時に適切なハンドリングが行われること |
| **境界値** | 最小値・最大値・空文字・null・0 などの境界を検証すること |

#### テスト名規約

```ts
// 「〜のとき、〜になる」形式
it('金額が0のとき、バリデーションエラーになる', ...)
it('未ログイン状態でアクセスしたとき、ログインページにリダイレクトされる', ...)
```

---

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `pnpm setup` | 初回セットアップ（install + .env + DB + migration） |
| `pnpm gen:keys` | JWT RS256 用の RSA 鍵ペアを生成し `.env` に追記 |
| `pnpm dev` | 全スタック起動（DB + codegen + api + web） |
| `pnpm dev:api` | API のみ起動 |
| `pnpm dev:web` | Web のみ起動 |
| `pnpm logs` | DB コンテナのログを tail 表示 |
| `pnpm db:start` | DB コンテナを起動 |
| `pnpm db:stop` | DB コンテナを停止 |
| `pnpm db:reset` | DB コンテナを完全リセット（volume 削除） |
| `pnpm db:start:test` | テスト用 DB（port 3307）を起動 |
| `pnpm db:migrate:dev --name <名前>` | スキーマ変更を migration.sql に自動生成して開発 DB に適用 |
| `pnpm db:migrate:deploy` | 既存の migration.sql を本番 DB に適用（SQL は生成しない） |
| `pnpm generate:openapi` | OpenAPI スペック（`packages/api-spec/openapi.yaml`）を再生成 |
| `pnpm codegen` | OpenAPI スペック生成 → 型定義生成（`api-client`）→ ビルド を一括実行 |
| `pnpm build` | 全体ビルド |
| `pnpm lint` | 全体 lint |

### OpenAPI スペックの同期

ルート定義（`createRoute()`）を変更したあとは、スペックを手動で再生成してください。
コミット時に Lefthook が差分を検知してガードします。

```bash
pnpm generate:openapi
git add packages/api-spec/openapi.yaml
```

## DB スキーマの変更手順（Prisma マイグレーション）

### 基本ルール

**`migration.sql` は手書き禁止。必ず `prisma migrate dev` で自動生成する。**

手書きすると COLLATE・文字コード・FK の非互換など、Prisma が自動で解決するミスを手動で管理しなければならない。

### スキーマ変更の手順

```bash
# 1. apps/api/prisma/schema.prisma を編集する

# 2. migration.sql を自動生成して開発 DB に適用する
pnpm db:migrate:dev --name <変更内容の説明>
#   例: pnpm db:migrate:dev --name add_user_profile_table
#   → apps/api/prisma/migrations/<timestamp>_<name>/migration.sql が生成される
#   → 開発 DB に即時適用される
#   → prisma generate（Prisma Client 再生成）も自動で行われる

# 3. DBML を再生成する（DB 設計書の同期）
pnpm db:docs
```

> `pnpm db:migrate:dev` は shadow DB（一時 DB）を使って差分を計算するため、`DATABASE_URL` で指定した DB への接続権限に加え、一時 DB の作成権限が必要です。ローカル開発環境では通常問題ありません。

### 本番 / CI へのデプロイ

```bash
# 既存の migration.sql をそのまま実行する（SQL は生成しない）
pnpm db:migrate:deploy
```

`pnpm setup` 内でも自動的に `prisma migrate deploy` が呼ばれます。

### マイグレーション失敗時のリカバリ

| 状況 | コマンド |
|---|---|
| failed 状態のマイグレーションをロールバック済みとしてマーク | `DATABASE_URL=... pnpm exec prisma migrate resolve --rolled-back <migration_name>` |
| 部分適用されたテーブルを手動で DROP してから再実行 | `pnpm db:migrate:deploy` |

---

## DB スキーマ共有（DBML / dbdocs.io）

### DBML の生成

TypeORM の Entity から DBML を生成します。

```bash
pnpm db:docs
```

生成物:

- `docs/database/schema.dbml`（DB スキーマはツール連携のため `docs/database/` に配置）

### dbdocs.io へアップロード（共有 URL 発行）

事前に `dbdocs` でログイン（またはトークン）を準備してください。

```bash
pnpm --filter @budget/api exec -- dbdocs login
```

共有（`--public` で URL 共有）:

```bash
pnpm db:share
```

補足:

- デフォルトでは `apps/api` の `db:share` は `--public` でアップロードします。
- `dbdocs build` は `--project` を指定することで、プロジェクト名（例: `yourname/budget-management-tool`）に紐づけられます。
- 初回は `dbdocs login`（または `dbdocs token`）が必要です。
