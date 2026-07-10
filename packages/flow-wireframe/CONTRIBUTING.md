# Contributing

## 開発環境

```bash
pnpm install
pnpm --filter @yyamamoto95/flow-wireframe type-check   # 型チェック
pnpm --filter @yyamamoto95/flow-wireframe test:unit    # ユニットテスト
pnpm --filter @yyamamoto95/flow-wireframe example      # サンプルHTMLの再生成
```

## 設計原則（PR を出す前に）

1. **ゼロ依存を守る** — ランタイム依存を追加しない。出力 HTML も外部リソース（CDN・フォント・JS）を参照しない
2. **決定的レンダリングを守る** — `Date.now()` や乱数など、同じ定義から異なる HTML を生む要素を入れない（再現性テストで検知される）
3. **語彙を増やしすぎない** — UI 部品は「打ち合わせで手描きするレベル」の粒度に留める。忠実なビジュアル表現は Figma 等に譲る
4. **壊れ方を親切に** — 検証エラーは非エンジニアが読んで直せる日本語で、生成前に全件報告する

## 変更時のチェックリスト

- [ ] 新しい部品・属性を追加したら `schema/flow-wireframe.schema.json` も更新する（型とスキーマの整合性テストあり）
- [ ] テストを追加・更新する
- [ ] `CHANGELOG.md` に変更内容を記載する
- [ ] `examples/` のサンプルを再生成してコミットする（生成物は定義と 1 対 1）

## リリース手順

1. `package.json` の `version` と `CHANGELOG.md` を更新して main にマージ
2. `flow-wireframe-v{version}` 形式のタグを push（例: `flow-wireframe-v0.2.0`）
3. GitHub Actions（`release-flow-wireframe.yml`）がテスト・ビルド・`npm publish` を実行する
   - リポジトリ Secrets に `NPM_TOKEN`（npm の Automation トークン）が必要
