# Changelog

本パッケージの変更履歴。[Semantic Versioning](https://semver.org/lang/ja/) に従う。

## [0.2.0] - 2026-07-10

他プロジェクト（デスクトップWeb + 自動化パイプライン）への適用評価を反映した汎用化リリース。

### Added

- `Screen.layout: "desktop"` — 560px のブラウザ枠（アドレスバー付き）。従来のスマホ枠(320px)と併用可
- `FlowStep.process` / `FlowStep.actor` — 画面を持たない処理ステップ（バッチ・自動化）と手順単位の主体
- `nav` 項目の `{label, goto}` 形式 — ナビゲーション経由の画面遷移をホットスポット化
- `button` / `link` の `external` — 外部サービスへの遷移（↗）
- JSON Schema 同梱（`schema/flow-wireframe.schema.json`）— `$schema` によるエディタ補完・機械検証
- README にフレームワーク運用プロセス（ストーリー選定 → 画面定義 → フロー定義 → 検証・生成）を明文化

## [0.1.0] - 2026-07-10

初版。

- JSON のフロー定義から自己完結型の静的 HTML（1ファイル・JSなし）を生成
- 画面カタログ・フローストリップ（ミニチュア＋操作矢印）・Gherkin 表・注釈
- `goto` によるアンカーリンク遷移と CSS `:target` ハイライト
- CLI（`init` / `check` / `build`）と日本語の検証エラーメッセージ
- 決定的レンダリング（同じ定義 → 同じ HTML）
