# ユーザー管理 操作ガイド

> **対象**: 開発者・運用担当者
> **関連 ADR**: `.github/arch/decision-log.md` — ADR-007（ユーザー管理機能の設計方針）

---

## 1. スキーマ変更 → マイグレーション → Seed の手順

### 1.1 スキーマ変更時の基本フロー

```
schema.prisma を編集
       ↓
マイグレーション SQL を手動作成（権限制約のため）
       ↓
prisma migrate deploy  ← マイグレーション適用
       ↓
prisma generate        ← @prisma/client 型 + DBML 自動更新
       ↓
pnpm run seed          ← 初期データ投入（冪等）
```

> **注意**: MySQL ユーザーに `CREATE DATABASE` 権限がないため、`prisma migrate dev`（シャドウDB使用）は実行不可。マイグレーションファイルは手動作成して `migrate deploy` で適用する。

### 1.2 マイグレーションファイルの作成方法

```bash
# 1. マイグレーションディレクトリを作成（命名: YYYYMMDDHHMMSS_<変更内容>）
mkdir -p apps/api/prisma/migrations/20260413000000_your_migration_name

# 2. migration.sql を作成して SQL を記述
# ファイル: apps/api/prisma/migrations/20260413000000_your_migration_name/migration.sql

# 3. マイグレーションを適用
set -a; source .env; set +a
pnpm --filter @budget/api exec prisma migrate deploy

# 4. Prisma Client + DBML を再生成
pnpm --filter @budget/api exec prisma generate
```

### 1.3 Seed データの投入

```bash
# 冪等: 既存レコードが存在する場合はスキップ
pnpm --filter @budget/api run seed
```

Seed で投入されるデータ:

| userId | userName | role  | status | 用途 |
|--------|----------|-------|--------|------|
| `Guest` | ゲスト   | GUEST | ACTIVE | ゲストログイン機能に必須 |

---

## 2. ユーザー管理 API エンドポイント

すべてのエンドポイントは **Bearer JWT 認証が必須**。

| メソッド | パス | 説明 |
|---------|------|------|
| `GET`    | `/api/user`             | ユーザー一覧取得 |
| `GET`    | `/api/user/{userId}`    | ユーザー詳細取得 |
| `POST`   | `/api/user`             | ユーザー新規作成 |
| `PUT`    | `/api/user/{userId}`    | ユーザー情報更新 |
| `DELETE` | `/api/user/{userId}`    | ユーザー削除 |

### リクエスト例: ユーザー作成

```bash
curl -X POST http://localhost:3001/api/user \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "山田太郎",
    "password": "securePassword123",
    "email": "taro@example.com",
    "role": "USER"
  }'
```

### リクエスト例: ユーザー更新

```bash
curl -X PUT http://localhost:3001/api/user/<userId> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "山田次郎",
    "role": "ADMIN",
    "status": "ACTIVE"
  }'
```

---

## 3. テストユーザーの作成方法

### 3.1 API 経由での作成（通常フロー）

```bash
# Step 1: ゲストまたは既存アカウントでログインしてトークンを取得
curl -X POST http://localhost:3001/api/guest-login | jq '.accessToken'

# Step 2: 取得したトークンでユーザーを作成
ACCESS_TOKEN="<上記で取得したトークン>"
curl -X POST http://localhost:3001/api/user \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "テストユーザー",
    "password": "testPassword123",
    "email": "test@example.com",
    "role": "USER"
  }'
```

### 3.2 Prisma Studio 経由での作成（GUI）

```bash
set -a; source .env; set +a
pnpm --filter @budget/api exec prisma studio
# ブラウザで http://localhost:5555 を開く
# user_list テーブルを選択 → 「Add record」
```

### 3.3 スクリプト経由での一括作成（CI/テスト環境）

```typescript
// apps/api/scripts/seed.ts を参考に追加実装
// userId は ULID で生成（import { ulid } from 'ulid'）
// パスワードは bcrypt.hash() でハッシュ化してから保存
```

---

## 4. UserRole / UserStatus の定義

### 4.1 UserRole

| ロール  | 説明 | 主な用途 |
|---------|------|---------|
| `ADMIN` | 管理者 | ユーザー管理、全データへのアクセス |
| `USER`  | 一般ユーザー | 自分のデータのみ操作可能 |
| `GUEST` | ゲスト | Seed で自動生成されるゲストログイン用アカウント |

### 4.2 UserStatus

| ステータス | 説明 |
|-----------|------|
| `ACTIVE`   | 有効（ログイン可能） |
| `INACTIVE` | 無効化（ログイン不可） |

> ユーザーを「削除せず無効化したい」場合は status を `INACTIVE` に更新する。

---

## 5. セキュリティ注意事項

- **パスワードは平文で保存しない**: API は平文パスワードを受け取り、インフラ層（`PrismaUserRepository`）で bcrypt (rounds=10) によりハッシュ化する。ドメイン層に生パスワードは入らない。
- **レスポンスにパスワードを含めない**: `serializeUser()` 関数が `password` フィールドを除去してからレスポンスを返す。
- **email の一意性**: DB レベルと UseCase レベルで二重チェックを実施している。
- **ゲストユーザーの削除禁止**: `userId: 'Guest'` はゲストログイン機能に必須。削除すると `/api/guest-login` が 404 を返す。

---

## 6. データモデル（ER 図）

最新の ER 図は以下で確認できる:

```bash
# DBML ファイルを再生成
pnpm --filter @budget/api exec prisma generate
# 生成先: docs/database/schema.dbml

# dbdocs.io に公開（DBML_TOKEN 要設定）
pnpm run db:share
```

`docs/database/schema.dbml` の `user_list` テーブル定義:

```dbml
Table user_list {
  userId    String   [pk]
  userName  String   [not null]
  email     String   [unique]
  password  String   [not null]    // bcrypt ハッシュ値（クライアントへの送信禁止）
  role      UserRole [not null, default: 'USER']
  status    UserStatus [not null, default: 'ACTIVE']
  createdAt DateTime [default: `now()`, not null]
  updatedAt DateTime [not null]
}
```

---

## 7. よく使うコマンド一覧

```bash
# マイグレーション状態の確認
pnpm --filter @budget/api exec prisma migrate status

# Prisma Client + DBML の再生成
pnpm run db:docs

# ユーザー一覧を Prisma Studio で確認
pnpm --filter @budget/api exec prisma studio

# 型チェック（スキーマ変更後に実施）
pnpm --filter @budget/api exec tsc --noEmit
```
