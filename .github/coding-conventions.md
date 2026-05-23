# コーディング規約

**このファイルは `.github/` SSOT の一部である。すべての AI エージェントはこのファイルを参照すること。**

---

## 共通（TypeScript）

### 型定義

- `any` の使用は原則禁止。やむを得ない場合は理由をコメントし `unknown` を検討する
- 型推論を優先するが、関数の引数と戻り値には必ず型注釈を付与する

### 非同期処理

- `async/await` を使用し、`Promise.then()` は避ける
- `try-catch` によるエラーハンドリングを適切に行い、握りつぶさない

### マジックナンバーの排除

- 意味のある数値や文字列は定数（`const`）または `as const` オブジェクトとして定義する

### コードの整理

- **未使用コードは必ず削除する**: 未使用の変数・関数・import・型定義はコードベースに残さない
- **命名は用途に追従させる**: リファクタリングや仕様変更で役割が変わった変数・関数は命名も同時に更新する。古い名前が残ると次の変更者が誤認する

### コメント・ドキュメント方針

- **必要な情報だけを残す**: コメントや JSDoc は必要な場合に必要な情報のみ記載する。論理名などドメインロジックが変わったとき差分が膨らむため、自明な説明は書かない
- **陳腐化した情報は削除する**: 過去の経緯・古い仕様のコメントアウトは誤認の原因になるため積極的に除去する
- **意図的な例外には必ずコメントを残す**: 一般的な実装と異なる、あるいは「なぜこうなっているか」が一見わからない箇所には、意図を明確に説明するコメントを付ける

---

## バックエンド（DDD / Onion Architecture）

| 層 | パス | ルール |
|----|------|--------|
| Domain | `apps/api/src/domain/` | 外部ライブラリへの依存禁止。値オブジェクト（Value Object）を活用する |
| Application | `apps/api/src/application/` | 1つのユースケースは1つの責務のみを持つ |
| Infrastructure | `apps/api/src/infrastructure/` | 外部接続（DB, API）の詳細はここに閉じ込める |
| Presentation | `apps/api/src/presentation/` | リクエストバリデーションを行い、不正なデータはユースケースに渡さない |

### パフォーマンス

- **N+1 を回避する**: ループ内でクエリを発行しない。関連データは `include` / `JOIN` でまとめて取得する
- **JOIN 数を抑える**: JOIN が掛け算になり結果セットが爆発しないよう、必要な関連のみを取得する。大量データの多段 JOIN は OOM の原因になる
- **DB 接続数を管理する**: コネクションプールの上限を意識し、不要なコネクションを長時間保持しない
- **トランザクションを適切に張る**: 複数テーブルへの書き込みは必ずトランザクションでまとめる。読み取り専用クエリには不要なトランザクションを張らない

---

## フロントエンド（Next.js App Router）

### Component 設計

- 1つのコンポーネントは 150行以内を目安にする
- 副作用（`useEffect`）の利用は最小限にし、イベントハンドラや `useMemo` で処理する

### UI/UX

- ローディング状態とエラー状態の表示を必ず考慮する
- 破壊的な操作の前には必ず確認（モーダル等）を挟む

### shadcn/ui ラッパーコンポーネント規約（必須）

> **この規約は ESLint ルール（`no-restricted-imports`）によって自動強制される。違反はコミット時に `lefthook` でブロックされる。**

| ルール | 内容 |
|--------|------|
| **プリミティブ直接インポート禁止** | `@radix-ui/*`・`vaul`・`sonner(Toaster)` を `src/` から直接インポートしてはならない |
| **ラッパー経由の義務** | `src/components/ui/` 配下のラッパーコンポーネントを使用すること |
| **ネイティブ要素の制限** | `<button>`, `<input>`, `<select>` 等は shadcn/ui 相当ラッパーが存在する場合は使用禁止 |
| **新規コンポーネントの追加** | UI プリミティブが必要な場合は先に `src/components/ui/` にラッパーを作成してから使用する |
| **例外** | `toast()` 関数など UI 以外の API は `sonner` から直接インポート可。`__tests__/` 内はモック目的のため除外 |

**現在のラッパー一覧** (`src/components/ui/`):

| ラッパー | 内部ライブラリ | 用途 |
|----------|--------------|------|
| `button.tsx` | `@radix-ui/react-slot` | ボタン |
| `dialog.tsx` | `@radix-ui/react-dialog` | モーダル |
| `drawer.tsx` | `vaul` | ドロワー |
| `select.tsx` | `@radix-ui/react-select` | セレクトボックス |
| `sonner.tsx` | `sonner` | トースト通知 |
| `form.tsx` | `@radix-ui/react-label` | フォームフィールド |
| `tabs.tsx` | `@radix-ui/react-tabs` | タブ |
| `popover.tsx` | `@radix-ui/react-popover` | ポップオーバー |
| `tooltip.tsx` | `@radix-ui/react-tooltip` | ツールチップ |
| `checkbox.tsx` | `@radix-ui/react-checkbox` | チェックボックス |
| `sheet.tsx` | `@radix-ui/react-dialog` | サイドシート |

---

## アイコン規約

- **アイコンライブラリの使用を必須とする**: UI にアイコンが必要な場合は必ず `lucide-react` を使用すること
- インラインの `<svg>` 直書きや絵文字での代替は禁止
- インポート例: `import { X, ChevronRight, TrendingDown } from "lucide-react";`
- サイズ指定: `size` prop または Tailwind の `w-*`/`h-*` クラスで統一する
- `strokeWidth` はデフォルト（2）を基本とし、デザイン上の理由がある場合のみ変更する

---

## Git 操作

- **コミットの粒度**: Atomic Commit（1変更＝1コミット）を徹底する
- **コミットメッセージ**: `.github/commit-message-instructions.md` に従うこと（SSOT）
- **PR の生成**: `.github/pull-request-instructions.md` に従うこと（SSOT）
- **ブランチ運用**: `{type}/{description}` 形式

---

## 開発・修正時の禁止事項

| 禁止事項 | 理由 |
|----------|------|
| 「ついで」の修正 | 指示外の箇所をリファクタリングしてはならない |
| 確認なしのコード削除 | コード削除時は影響範囲を報告し、許可を得ること |
| コメントの勝手な削除 | 既存の JSDoc や注釈を勝手に削除しない |
| 絵文字の使用 | コード・UI・コミットメッセージ・ドキュメントのいかなる箇所にも絵文字（emoji）を使用してはならない |

---

## Gemini Code Assist レビューガイド

> `GEMINI.md`（リポジトリルート）は Gemini Code Assist の読み込みエントリポイント。
> 規約の実体はここに集約されている（SSOT）。

### レビュー対象と優先度

#### 重点レビュー対象（`apps/web/`, `apps/api/`）

上記の TypeScript・DDD・フロントエンド・アイコン規約をすべて適用してレビューすること。

- レイヤーを跨ぐ不正な依存（例: Domain が Infrastructure を import）は必ず指摘する
- `apps/web/src/` 配下での `@radix-ui/*`・`vaul`・`sonner(Toaster)` の直接 import は指摘する（`src/components/ui/` ラッパー経由が必須）

#### 限定的レビュー対象（`apps/sandbox/`）

`apps/sandbox/` は UI/UX プロトタイプ専用。以下は **指摘しない**:

- ネイティブ HTML 要素（`<button>`, `<input>` 等）の直接使用
- Radix UI プリミティブの直接 import
- 150 行超のコンポーネント
- framer-motion の多用（プロトタイプ表現のため）
- `any` の使用（指摘はしてよいが修正必須とはしない）

**セキュリティ上の問題（XSS・シークレットのハードコード）は sandbox でも指摘すること。**

#### レビュー不要（スキップ）

- `**/__tests__/**`, `**/*.test.ts`, `**/*.test.tsx` — テストファイル
- `.github/velocity-log.json` — 自動生成ファイル
- `apps/api/prisma/migrations/**` — 自動生成マイグレーション
- `infra/**` — Terraform（別途 infra チェックがある）
- `*.md` — ドキュメント

### コメントスタイル

- コメントは **日本語** で書く
- 指摘は「なぜ問題か」を明確に説明し、修正案は具体的なコードスニペットで示す
- 重大度を明示する: `[CRITICAL]` / `[MAJOR]` / `[MINOR]` / `[NIT]`
  - `[CRITICAL]`: セキュリティ・データ損失リスク → 必ずマージ前に修正
  - `[MAJOR]`: 規約違反・バグの可能性 → 原則修正
  - `[MINOR]`: 改善提案 → 任意
  - `[NIT]`: 細かいスタイル → 任意

### 指摘しなくてよいこと（意図的な設計）

- コミットメッセージが日本語であること（プロジェクト規約）
- `apps/web/src/components/ui/` 配下が Radix UI を import していること（ラッパー本体のため）
- 絵文字がコードに存在しないこと（絵文字禁止規約のため）
