# /pr

このスキルを実行する前に、必ず以下の 2 ファイルを読み取り、
そこに定義されたルールとフォーマットに従って PR を生成してください。

- `.github/pull-request-instructions.md` — PR 生成の論理ルール
- `.github/PULL_REQUEST_TEMPLATE.md` — PR 本文のフォーマット

## 実行プロセス

1. **規約の読み取り**
   - `.github/pull-request-instructions.md` を読み込み、生成プロセス・記述ガイドライン・NG 事項を把握する。
   - `.github/PULL_REQUEST_TEMPLATE.md` を読み込み、本文の構造を確認する。

2. **プッシュの実行**
   - `git push origin HEAD` を実行する。

3. **PR 情報の生成**
   - **タイトル**: コミットメッセージ、または `/translate` で定義した技術的課題から生成する。
   - **本文**: `.github/PULL_REQUEST_TEMPLATE.md` の構造に従い、以下を網羅して生成する。
     - 概要: 修正の目的と達成したこと（`.github/pull-request-instructions.md` の「記述ガイドライン」に準拠）
     - 変更内容: 差分に基づいた具体的な修正事項の箇条書き
     - 影響範囲: 副作用や関連機能への影響
     - テスト内容: 実施・追加したテストの概要

4. **PR 作成の実行**
   - `gh pr create --title "{title}" --body "{body}"` を実行する。

5. **報告**
   - 作成された PR の URL をユーザーに提示する。

## 制約

- `gh` コマンドがインストールされていない場合は、エラーを報告しインストールを促す。
- すでに PR が存在する場合は、その URL を表示するのみとする。
- 本文は必ず日本語で出力すること（`.github/pull-request-instructions.md` の言語ルールに準拠）。
- 差分に含まれていない機能を説明に含めないこと。
