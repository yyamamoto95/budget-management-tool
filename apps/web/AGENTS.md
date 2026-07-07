<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## コンポーネント層の使い分けルール（SSOT）

プリミティブ UI（ボタン・ダイアログ・入力等）は **`src/components/ui/`（shadcn/ui）を唯一の標準層**とする。
必要なプリミティブが無い場合は `pnpm dlx shadcn@latest add {name}` で追加し、自作しない。
業務コンポーネントは機能ディレクトリ（`dashboard/` `expense/` `settings/` 等）に配置し、`ui/` のプリミティブを組み合わせて実装する。
`common/` は複数機能で共有する業務コンポーネント（AmountField・MoneyInput 等）専用であり、汎用 UI キットを新設してはならない（#465 で未使用キット 12 コンポーネントを削除済み）。

## UI/UX 変更前に必ず確認すること

`src/components/` または `src/app/` に新規コンポーネントや画面デザインの変更を加える場合は、
**先に `apps/sandbox/` でプロトタイプを作成し、ユーザーのレビューを得てから本番実装すること。**

ルールの詳細: [`apps/sandbox/AGENTS.md`](../sandbox/AGENTS.md)
