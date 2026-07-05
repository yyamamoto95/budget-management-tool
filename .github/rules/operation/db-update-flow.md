# DB 更新フロー（Prisma スキーマ駆動）

> **Single Source of Truth**: `apps/api/prisma/schema.prisma` がすべての正解。DBML ファイルの手動編集禁止。

---

## 全体フロー

```
schema.prisma を変更
       ↓
prisma migrate dev    ← マイグレーション SQL を生成・適用
       ↓
prisma generate       ← @prisma/client 型 + docs/database/schema.dbml を自動更新
       ↓
dbdocs build          ← 外部設計書（dbdocs.io）を同期（任意）
```

---

## ステップ 1: schema.prisma を変更する

`apps/api/prisma/schema.prisma` を直接編集する。

```prisma
// 例: BudgetList にメモ欄を追加
model BudgetList {
  // ... 既存フィールド
  memo  String?  @db.VarChar(500)  // ← 追加
}
```

---

## ステップ 2: マイグレーションを生成・適用する

```bash
# 開発環境（マイグレーションファイルを生成して即適用）
cd apps/api
npx prisma migrate dev --name add_memo_to_budget_list

# または pnpm スクリプト経由
pnpm --filter @budget/api run migration:dev
```

実行結果:
- `apps/api/prisma/migrations/YYYYMMDDHHMMSS_add_memo_to_budget_list/migration.sql` が生成される
- 開発 DB に即適用される
- `@prisma/client` が再生成される

> **本番・CI 環境では** `prisma migrate deploy` を使用する（`migration:run`）:
> ```bash
> pnpm --filter @budget/api run migration:run
> ```

---

## ステップ 3: 型と DBML を更新する

```bash
# Prisma Client（型定義）+ docs/database/schema.dbml を再生成
npx prisma generate

# または pnpm スクリプト経由
pnpm run db:docs
```

実行後に変更されるファイル:
- `node_modules/@prisma/client/` （TypeScript 型定義）
- `docs/database/schema.dbml` （DBML 設計書）

> `prisma migrate dev` は内部で `prisma generate` を自動実行するため、開発環境では省略可能。

---

## ステップ 4: 外部設計書を同期する（任意）

```bash
# dbdocs.io にアップロード（要 DBML_TOKEN 設定）
pnpm run db:share
```

これにより非エンジニアも `https://dbdocs.io/` で最新の設計書を確認できる。

---

## カラム名変更時の型安全デモ

Prisma の最大の利点は「スキーマ変更が TypeScript エラーとして即座に伝播する」こと。

### 手順

1. `schema.prisma` でフィールド名を変更:
   ```prisma
   // 変更前
   categoryId  Int  @default(1) @map("categoryId")
   // 変更後
   expenseCategory  Int  @default(1) @map("categoryId")
   ```

2. `prisma generate` を実行:
   ```bash
   npx prisma generate
   ```

3. TypeScript エラーが発生する箇所（Infrastructure 層のリポジトリ）:
   ```
   error TS2339: Property 'categoryId' does not exist on type 'BudgetList'.
   ```

4. エラー箇所のみ修正（Domain 層・Application 層は影響なし）:
   ```typescript
   // PrismaExpenseRepository.ts
   categoryId: record.expenseCategory,  // ← 修正箇所
   ```

> Domain 層（`Expense.ts`）や UseCase 層には変更不要。
> クリーンアーキテクチャにより、インフラの変更が上位層に波及しない。

---

## ルール・禁止事項

| 操作 | 可否 |
|------|------|
| `schema.prisma` の直接編集 | ✅ 推奨 |
| `prisma migrate dev` でのマイグレーション生成 | ✅ 推奨 |
| `docs/database/schema.dbml` の手動編集 | ❌ 禁止（`prisma generate` で上書きされる） |
| DB への直接 DDL 実行（ALTER TABLE 等） | ❌ 禁止（マイグレーション履歴と乖離する） |
| マイグレーションファイルの手動編集 | ⚠️ 原則禁止（破壊的変更時のみ、レビュー必須） |

---

## よく使うコマンド一覧

```bash
# 新規マイグレーション作成（開発）
pnpm --filter @budget/api run migration:dev

# マイグレーション適用（本番/CI）
pnpm --filter @budget/api run migration:run

# Prisma Client + DBML 再生成
pnpm run db:docs

# dbdocs.io にアップロード
pnpm run db:share

# DB スキーマの現在状態を確認
pnpm --filter @budget/api exec prisma migrate status

# Prisma Studio（GUI でデータ確認）
pnpm --filter @budget/api exec prisma studio
```
