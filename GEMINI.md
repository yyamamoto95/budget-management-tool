# Gemini Code Assist — レビューガイドライン

このリポジトリの規約は **`.github/coding-conventions.md`** に一元管理されています（SSOT）。

レビュー時は必ず `.github/coding-conventions.md` を参照してください。
同ファイルの末尾セクション **「Gemini Code Assist レビューガイド」** に、レビュー対象・優先度・コメントスタイル・指摘不要事項を記載しています。

---

## プロジェクト概要

家計管理 Web アプリ（Next.js + Hono）のモノレポ。DDD / Onion Architecture を採用。

```
apps/
  web/        # Next.js フロントエンド（本番コード）
  api/        # Hono バックエンド（本番コード）
  sandbox/    # UI プロトタイプ（規約の適用は限定的）
packages/
  common/     # 共通型定義
  api-client/ # API クライアント
```

詳細: `.github/project-overview.md`
