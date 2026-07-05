# アーキテクチャ決定記録（Architecture Decision Log）

> 設計上の重要な決定とその根拠を記録する。変更時は新エントリを追記し、既存エントリは削除しない。

---

## ADR-001: デザイントークンの強制とマジックナンバーの禁止

**日付**: 2026-04-12
**ステータス**: 採用

### 決定
- 色・スペーシング・ボーダー半径などすべてのデザイン値を CSS 変数（`--color-*`, `--spacing-*`, `--radius-*`）として定義する
- Tailwind CSS の `extend` ブロックでこれらの CSS 変数を参照する
- ソースコード内への直接的な色コード・px 値の記述を禁止する

### 背景
- デザインと実装の乖離が時間とともに拡大し、UI の一貫性が失われる問題が生じた
- Figma 上のデザイン変更をコードに手動で反映する作業コストが高かった

### 理由
- CSS 変数を SSOT（Single Source of Truth）とすることで、`scripts/sync-tokens.ts` による自動変換が機能する
- Figma Variables → CSS 変数 → Tailwind トークン のパイプラインが確立され、デザイン変更が自動でコードに伝播する
- Lefthook の pre-commit フックでトークン同期チェックを強制し、人的ミスを排除する

### 影響
- 新規コンポーネント作成時は必ず Tailwind トークンクラスを使用する
- ハードコードされた値が PR レビューで検出された場合、マージを拒否する

---

## ADR-002: バックエンド API の SSOT をコード（Route定義）に置く

**日付**: 2026-04-12
**ステータス**: 採用

### 決定
- `@hono/zod-openapi` の `createRoute()` をすべての API エンドポイントの唯一の定義場所とする
- `openapi.yaml` は `generate:openapi` スクリプトで自動生成される成果物であり、手動編集を禁止する
- `app.get()` 等の標準メソッド使用を禁止し、`app.openapi()` のみを使用する

### 背景
- YAML ファイルをコードと別管理すると、実装と仕様の乖離が発生しやすい
- レビュー時にどちらが正しいか判断が困難になる問題があった

### 理由
- `createRoute()` の `summary`, `description`, `request`, `responses` が型レベルで必須化されることで、ドキュメント漏れが型エラーとして検出される
- Lefthook の `openapi-sync` チェックにより、スペック未更新のコミットが物理的に不可能になる
- `packages/api-spec/openapi.yaml` → `openapi-typescript` → `packages/api-client/src/schema.d.ts` のパイプラインで型安全なクライアントコードが自動生成される

### 影響
- ルート追加・変更時は `generate:openapi` の実行が必須（Lefthook が強制）
- `openapi.yaml` を直接編集した場合、次回コミット時の差分チェックで検出される

---

## ADR-003: フロントエンドの HTTP クライアントに openapi-fetch を採用

**日付**: 2026-04-12
**ステータス**: 採用

### 決定
- `packages/api-client` は `openapi-fetch` + `openapi-typescript` 生成型を使用する
- Orval によるクライアント自動生成は採用しない（現時点）

### 背景
- フロントエンドが API の型定義に強く依存する構造を確立したい
- 生成コードの可読性・カスタマイズ性のバランスが必要

### 理由
- `openapi-typescript` は型定義のみを生成し、実際の HTTP 呼び出しコードは `openapi-fetch` が担う
- 生成される `schema.d.ts` は型定義のみであるため、カスタムロジックを共存させやすい
- `pnpm codegen` コマンド1つで `openapi.yaml` → 型定義 → ビルドまで完結する

### 将来的な拡張
- Orval への移行は、React Query / SWR との統合が必要になった時点で検討する

---

## ADR-004: モノリポのパッケージ構成

**日付**: 2026-04-12
**ステータス**: 採用

### 決定
```
apps/
  api/          # Hono バックエンド
  web/          # Next.js フロントエンド
packages/
  common/       # FE/BE 共用型定義・ユーティリティ
  api-spec/     # 生成された openapi.yaml（成果物）
  api-client/   # openapi-fetch クライアント + 生成型
```

### 依存関係の方向
```
web → api-client → api-spec ← api
web → common ← api
```

- `api-spec` は `api` が生成し、`api-client` と `web` が参照する
- `common` はドメイン型を共有するが、UI・インフラの詳細を含まない

---

## ADR-005: Hono への移行とクリーンアーキテクチャの採用

**日付**: 2026-04-12
**ステータス**: 採用（ADR-002 と連動）

### 決定
- バックエンドフレームワークを Express から Hono に移行する
- Onion Architecture（Domain → Application → Infrastructure → Presentation）を採用する

### 背景
- Express は Node.js 専用であり、Edge Runtime や Cloudflare Workers への移行コストが高い
- フレームワークにビジネスロジックが依存していたため、テスト・移植が困難だった

### 理由（Hono 選定）
- ランタイム非依存（Node.js / Bun / Deno / Edge）により将来の実行環境変更に対応できる
- `@hono/zod-openapi` による `createRoute()` で、リクエスト/レスポンスの型安全性を E2E で確保できる
- Web Standard API（`Request` / `Response`）ベースのため、フレームワーク固有 API への依存が最小化される

### 理由（クリーンアーキテクチャ採用）
- Domain 層はフレームワーク・ORM・DB に一切依存しないため、ビジネスロジックの資産価値が永続する
- ORM の乗り換え（TypeORM → Prisma 等）はインフラ層のみで完結し、ドメイン・アプリケーション層に影響しない
- UseCase の単体テストが ORM・DB なしで書ける

### 影響
- ルートハンドラ（Presentation 層）は `IXxxRepository` インターフェースのみに依存する
- インフラ実装の詳細（Prisma 型等）をドメイン層に漏洩させてはならない

---

## ADR-006: ORM を TypeORM から Prisma に移行

**日付**: 2026-04-13
**ステータス**: 採用

### 決定
- ORM を TypeORM 0.3.x から Prisma 6.x に完全移行する
- `apps/api/prisma/schema.prisma` をデータベーススキーマの唯一の正解（SSOT）とする
- `prisma-dbml-generator` により `npx prisma generate` で `docs/database/schema.dbml` を自動更新する
- DBML ファイルの手動編集を禁止する

### 背景
- TypeORM はデコレータ（`@Entity`, `@Column` 等）でスキーマを定義するため、実際の DB スキーマと乖離が生じやすかった
- `emitDecoratorMetadata: true` を必要とするため、`tsx` / esbuild 系ツールと相性が悪く、開発体験が低下していた
- マイグレーション生成の信頼性が低く、差分検出が不安定なケースがあった
- TypeScript 型と DB スキーマの同期が自動化されていなかった（Entity 変更後に型エラーが発生しないケースがあった）

### 理由（Prisma 選定）
- スキーマ駆動開発: `schema.prisma` を変更 → `prisma migrate dev` → `prisma generate` の 3 ステップで型・DB・DBML がすべて同期される
- 型安全性: `@prisma/client` の生成型により、テーブルの変更が TypeScript エラーとして即座に検出される
- マイグレーション信頼性: マイグレーション SQL は `prisma/migrations/` に明示的に保存され、差分が透明
- 開発体験: デコレータ不要（`emitDecoratorMetadata` 廃止）、`tsx` で直接実行可能
- DBML 自動連携: `prisma-dbml-generator` により、非エンジニアでも `dbdocs` で最新の設計書を参照できる

### クリーンアーキテクチャとの整合
- Prisma 型（`UserList`, `BudgetList` 等）は Infrastructure 層にのみ留まる
- 各 Prisma リポジトリ内でドメインモデルへの変換（`toDomain()` 関数）を実施し、UseCase / Domain 層への漏洩を防ぐ

### 影響
- `typeorm`, `reflect-metadata`, `tsconfig-paths`, `ts-node`, `typeorm-ts-node-commonjs` を削除
- API サーバー起動コマンドが `ts-node -r tsconfig-paths/register` → `tsx src/index.ts` に変更
- `migration:run` が `TypeORM DataSource.runMigrations()` → `prisma migrate deploy` に変更
- `db:docs` が `generate-dbml.ts` スクリプト → `prisma generate` に変更（自動化）

---

## ADR-007: ユーザー管理機能の設計方針

**日付**: 2026-04-13
**ステータス**: 採用

### 決定

1. **認証・認可の責務配置**: 認証（パスワード検証・トークン発行）は Application 層（TokenService / UseCase）で担い、Domain 層はパスワードのハッシュ値を保持するのみとする
2. **バリデーション**: メールアドレス形式・ユーザー名長さ等の不変条件は Domain 層（`User.create()` ファクトリ）で検証し、`ValidationError` をスローする
3. **パスワード秘匿化**: 生パスワードの Domain 層への持ち込みを禁止する。bcrypt ハッシュ化は Infrastructure 層（`PrismaUserRepository`）のみで実施する

### 背景

- 既存の `user.ts` ルートハンドラがリポジトリを直接呼び出しており、UseCase を通さないアクセスが発生していた（禁止事項違反）
- `User` エンティティに `role`/`status` が存在せず、権限管理の基盤がなかった
- `IUserRepository.login()` が `errorModel` を返す設計で、Use Case 層での再利用性が低かった

### 理由

- UseCase 層を必ず経由させることで、所有者チェック・権限検証・ビジネスルール適用を一箇所に集約できる
- `User.create()` ファクトリがバリデーションを担うことで、どのルートから生成されても不正な状態のエンティティが作られない
- bcrypt をインフラ層に閉じ込めることで、Domain/Application 層はパスワード処理ライブラリに依存しない（テスト容易性向上）

### ドメインモデルの不変条件

```
userName : 1〜50文字
email    : RFC 5321 形式（null 許容）
role     : 'ADMIN' | 'USER' | 'GUEST'
status   : 'ACTIVE' | 'INACTIVE'
password : 常にハッシュ済み文字列（Domain 層では生値を受け取らない）
```

### IUserRepository インターフェース変更

```typescript
// 旧: all(), one(), save(userId, userName, password), login()
// 新: findAll(), findById(), create(), update(), remove(), verifyPassword(), findByEmail()
```

`save()` の廃止により「作成」と「更新」が明確に分離され、意図のないデータ上書きを防止する。

### 影響

- `presentation/routes/user.ts`: リポジトリ直接呼び出しをすべて UseCase 経由に変更
- `presentation/routes/auth.ts`: `login()` → `verifyPassword()` + `findById()` に変更
- `prisma/schema.prisma`: `UserList` に `email`, `role`, `status`, `createdAt`, `updatedAt` を追加
- `packages/common/src/types/user.ts`: `UserRole`, `UserStatus` 型を追加

---

## ADR-008: 認証方式を RS256 JWT + HttpOnly Cookie に移行

**日付**: 2026-04-11
**ステータス**: 採用

### 決定
- Hono `setSignedCookie` によるセッション Cookie 方式を廃止し、**RS256 JWT + HttpOnly Cookie（Next.js 管理）** に移行する
- Access Token 15分 / Refresh Token 7日。Refresh Token は使い捨て（Rotation）とし、平文は保存せず SHA-256 ハッシュのみ DB 保存する
- 失効済み Refresh Token の再利用を検知した場合、該当ユーザーの全 Refresh Token を即時失効する（盗難の自動検知・遮断）

### 背景
- **クロスオリジン Cookie 問題**: API（`:3001`）発行の `Set-Cookie` が Next.js（`:3000`）に届かず、ログイン後も認証状態が維持できなかった
- **二重管理**: セッション状態を API 側で持つため、Next.js Middleware からの検証に API 呼び出しが必要だった

### 理由
- **RS256（非対称鍵）**: 署名は API の秘密鍵のみ、検証は公開鍵で可能。Next.js Middleware が公開鍵のみで JWT を検証でき、秘密鍵の露出リスクが局所化される。将来の他サービス連携も公開鍵配布で対応可能
- **HttpOnly Cookie**: XSS で `document.cookie` から窃取不可。LocalStorage 保存は禁止。`SameSite=Strict` で CSRF を遮断
- **トークン有効期限**: Access 15分は漏洩時の被害限定、Refresh 7日は UX とセキュリティのバランス

### 影響
- 認証フロー: ログイン → API が JWT 発行 → Next.js Server Action が HttpOnly Cookie にセット → 以降 `Authorization: Bearer` で API 検証 → 期限切れは Middleware が自動リフレッシュ
- 実装の中心: `apps/api` の TokenService / auth ルート / 認証 Middleware、`apps/web` の `middleware.ts` / auth Server Actions
- 鍵の生成・管理は `pnpm gen:keys`（`scripts/gen-keys.ts`）を使用
