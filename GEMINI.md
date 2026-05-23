# Gemini Code Assist — レビューガイドライン

このファイルは Gemini Code Assist がコードレビューを行う際の指針です。
プロジェクトの詳細な規約は `.github/coding-conventions.md` に一元管理されています（SSOT）。

---

## プロジェクト概要

家計管理 Web アプリ（Next.js + Hono）のモノレポ。
DDD / Onion Architecture を採用しており、レイヤー間の依存方向が規約として定められています。

```
apps/
  web/        # Next.js フロントエンド（本番コード）
  api/        # Hono バックエンド（本番コード）
  sandbox/    # UI プロトタイプ（規約の適用は限定的 — 後述）
packages/
  common/     # 共通型定義
  api-client/ # API クライアント
```

---

## レビュー対象と優先度

### 重点レビュー対象（`apps/web/`, `apps/api/`）

以下の観点で重点的にレビューしてください。

#### TypeScript
- `any` の使用は禁止。`unknown` を提案すること
- 関数の引数・戻り値には型注釈を付与する
- `async/await` を使用し `Promise.then()` チェーンは避ける

#### バックエンド — DDD / Onion Architecture
| 層 | パス | チェック観点 |
|---|---|---|
| Domain | `apps/api/src/domain/` | 外部ライブラリへの依存がないか |
| Application | `apps/api/src/application/` | 1ユースケース = 1責務になっているか |
| Infrastructure | `apps/api/src/infrastructure/` | DB/外部API の詳細がここに閉じているか |
| Presentation | `apps/api/src/presentation/` | 入力バリデーションが行われているか |

**レイヤーを跨ぐ不正な依存（例: Domain が Infrastructure を import）は必ず指摘してください。**

#### フロントエンド — Next.js
- `apps/web/src/` 配下で Radix UI プリミティブ（`@radix-ui/*`）や `vaul`、`sonner(Toaster)` を直接 import している場合は指摘する。`src/components/ui/` のラッパー経由が必須
- コンポーネントは 150 行以内を目安とする
- `useEffect` の過剰使用はイベントハンドラや `useMemo` への置き換えを提案する
- ローディング状態・エラー状態の考慮が抜けていれば指摘する

#### セキュリティ
- SQL インジェクション、XSS、認証バイパスなどの脆弱性は必ず指摘する
- 環境変数・シークレットのハードコードは即時指摘する

#### アイコン
- `lucide-react` 以外のアイコン（インライン SVG、絵文字含む）は指摘する

---

### 限定的レビュー対象（`apps/sandbox/`）

`apps/sandbox/` は **UI/UX プロトタイプ専用** のディレクトリです。

- ネイティブ HTML 要素（`<button>`, `<input>` 等）の直接使用は **指摘しない**
- Radix UI プリミティブの直接 import は **指摘しない**
- 150 行超のコンポーネントは **指摘しない**
- `any` の使用は指摘してよいが、修正必須とはしない

**セキュリティ上の問題（XSS、シークレットのハードコード）は sandbox でも指摘してください。**

---

### レビュー不要（スキップ）

以下のファイル・ディレクトリはレビューをスキップしてください。

- `**/__tests__/**`, `**/*.test.ts`, `**/*.test.tsx` — テストファイル
- `.github/velocity-log.json` — 自動生成ファイル
- `apps/api/prisma/migrations/**` — 自動生成マイグレーション
- `infra/**` — Terraform（別途 infra チェックがある）
- `*.md` — ドキュメント（コードではないため）

---

## コメントスタイル

- **コメントは日本語で書いてください**
- 指摘は「なぜ問題か」を明確に説明する
- 修正案は具体的なコードスニペットで示す
- 重大度を明示する: `[CRITICAL]` / `[MAJOR]` / `[MINOR]` / `[NIT]`
- `[CRITICAL]`: セキュリティ・データ損失リスク → 必ずマージ前に修正
- `[MAJOR]`: 規約違反・バグの可能性 → 原則修正
- `[MINOR]`: 改善提案 → 任意
- `[NIT]`: 細かいスタイル → 任意

---

## 指摘しなくてよいこと

以下はこのプロジェクトの意図的な設計です。指摘不要です。

- `apps/sandbox/` での framer-motion の多用（プロトタイプ表現のため）
- コミットメッセージが日本語であること（プロジェクト規約）
- `apps/web/src/components/ui/` 配下のコンポーネントが Radix UI を import していること（ラッパー本体のため）
- 絵文字がコードに存在しないこと（絵文字禁止規約のため）
