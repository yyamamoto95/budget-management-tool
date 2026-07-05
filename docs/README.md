# docs/ — ドキュメント構成

本ディレクトリは **ツール連携が必要なファイル** のみを格納する。

プロジェクトの規約・設計・仕様・プロセス定義の SSOT は **`.github/`** に一元管理されている。
ドキュメントの所在と優先順位は `.github/sprint-protocol.md` セクション 5「SSOT マップ」を唯一のインデックスとする（本ファイルでの二重管理はしない）。

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
