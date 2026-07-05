# docs/ — ドキュメント構成

本ディレクトリは **ツール連携が必要なファイル** のみを格納する。

プロジェクトの規約・設計・仕様・プロセス定義の SSOT は **`.github/`** に一元管理されている。
詳細は `.github/multi-agent-roles.md` の「リポジトリ内の参照パス」を参照すること。

## ディレクトリ構成

```
docs/
  README.md        # このファイル
  database/
    schema.dbml    # DB スキーマ定義（自動生成・編集禁止）
                   # SSOT: apps/api/prisma/schema.prisma
                   # pnpm db:docs で再生成する
```

## なぜ database/ だけここに置くか

`schema.dbml` は `pnpm db:docs`（dbml-generator）が `docs/database/` に出力するため、
ツール設定との整合性を維持するためにここに配置する。

## SSOT マップ

| 情報 | 正規ソース |
|------|---------|
| デザイントークン | `.github/design/figma-tokens.json` |
| DB スキーマ | `apps/api/prisma/schema.prisma` |
| DB スキーマ（DBML） | `docs/database/schema.dbml`（自動生成） |
| API スキーマ | `packages/api-spec/openapi.yaml` |
| プロジェクト概要・命名規則 | `.github/project-overview.md` |
| コーディング規約 | `.github/coding-conventions.md` |
| AI エージェントワークフロー | `.github/ai-agent-workflow.md` |
| スプリントプロセス | `.github/sprint-protocol.md` |
| コミット規約 | `.github/commit-message-instructions.md` |
| PR 生成ルール | `.github/pull-request-instructions.md` |
| マルチエージェント役割 | `.github/multi-agent-roles.md` |
| プロダクト要件（PRD） | `.github/PRD/` |
| 設計・UI/UX | `.github/design/` |
| アーキテクチャ決定記録・DDD ルール | `.github/arch/` |
| 運用ガイド | `.github/operation/` |
