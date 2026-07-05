# 認証セキュリティ運用ガイド

## 1. 初期セットアップ（鍵生成）

```bash
# RSA 鍵ペアを生成して .env に追記する
pnpm gen:keys

# Next.js 側にも公開鍵を設定する
# 上記コマンドの出力から JWT_PUBLIC_KEY の行をコピーして以下に追記:
echo 'JWT_PUBLIC_KEY="..."' >> apps/web/.env.local
```

生成された秘密鍵（`JWT_PRIVATE_KEY`）は **API サーバーのみ**に設定する。
公開鍵（`JWT_PUBLIC_KEY`）は API サーバーと Next.js サーバー両方に設定する。

## 2. DB マイグレーション実行

```bash
pnpm --filter @budget/api migration:run
```

`refresh_tokens` テーブルが作成される。

## 3. 鍵のローテーション手順

定期的（推奨: 6ヶ月〜1年）またはインシデント発生時に実施する。

```bash
# Step 1: 新しい鍵ペアを生成（既存の鍵は上書きしない）
pnpm gen:keys
# ⚠️ 既存の JWT_PRIVATE_KEY が .env に存在する場合は手動で更新する

# Step 2: .env の JWT_PRIVATE_KEY / JWT_PUBLIC_KEY を新しい値に更新
# （エディタで直接編集）

# Step 3: apps/web/.env.local の JWT_PUBLIC_KEY も更新

# Step 4: API サーバーと Next.js サーバーを再起動
# 再起動後、旧トークンは検証エラーになるため全ユーザーの再ログインが必要

# Step 5: refresh_tokens テーブルの旧トークンを全削除（任意）
# DELETE FROM refresh_tokens WHERE created_at < NOW();
```

## 4. 異常検知時のセッション強制終了

### 特定ユーザーの全セッションを無効化

```sql
-- ユーザー 'user01' の全 Refresh Token を失効させる
UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE user_id = 'user01' AND revoked_at IS NULL;
```

### 全ユーザーのセッションを強制終了（インシデント時）

```sql
-- 全 Refresh Token を失効させる
UPDATE refresh_tokens SET revoked_at = NOW() WHERE revoked_at IS NULL;
```

実行後、全ユーザーは次のリクエスト時に再ログインを求められる。

### 期限切れトークンのクリーンアップ

```sql
-- 期限切れトークンを削除（定期バッチとして実行推奨）
DELETE FROM refresh_tokens WHERE expires_at < NOW();
```

## 5. JWT デコード手順（デバッグ用）

⚠️ 署名検証なしのデコードはデバッグ専用。本番環境での認可判断に使ってはならない。

```bash
# Base64 デコードでペイロードを確認（署名検証なし）
echo "<JWT の第2セグメント>" | base64 -d | python3 -m json.tool

# 例: トークン "aaa.bbb.ccc" の場合
echo "bbb==" | base64 --decode | python3 -m json.tool
```

または Node.js で:

```javascript
const jwt = 'eyJ...';
const [, payload] = jwt.split('.');
const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
console.log(decoded);
// { sub: 'user01', jti: '01ARZ...', iat: 1700000000, exp: 1700000900 }
```

## 6. Refresh Token Reuse Detection の動作確認

侵害検知の動作確認方法:

```bash
# Step 1: ログインして refresh_token を取得
curl -X POST http://localhost:3001/api/login \
  -H 'Content-Type: application/json' \
  -d '{"userId":"user01","password":"password"}'
# → { "accessToken": "...", "refreshToken": "TOKEN_A" }

# Step 2: TOKEN_A でリフレッシュ（正常）
curl -X POST http://localhost:3001/api/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"TOKEN_A"}'
# → { "accessToken": "...", "refreshToken": "TOKEN_B" }

# Step 3: 古い TOKEN_A を再利用（攻撃シミュレーション）
curl -X POST http://localhost:3001/api/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"TOKEN_A"}'
# → 401 "不正なトークンが検出されました"
# かつ DB の user01 の全 refresh_token が revoked_at セット済みになる

# Step 4: TOKEN_B も使えないことを確認
curl -X POST http://localhost:3001/api/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"TOKEN_B"}'
# → 401 "トークンが無効です。再ログインしてください"
```
