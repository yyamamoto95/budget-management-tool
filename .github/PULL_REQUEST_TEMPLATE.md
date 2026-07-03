<!--
タイトル形式: feat|fix|refactor|docs|chore: {簡潔な内容}
例: feat: 取引保存時に userId を付与する
記載ルールの詳細: .github/git-conventions.md
-->

## 📋 概要

<!-- このPRで達成したこと、修正の目的を簡潔に記載 -->

## 🛠 変更内容

<!-- 差分に基づいた具体的な修正事項を、事実ベースで網羅的に記載 -->

-

## Test plan（テスト項目・エビデンス）

<!--
必須: CI の Test Plan Check が本セクションを検証する。
・検証した観点（正常系・異常系・境界値）をチェックボックスで列挙する
・各項目にエビデンスを添える: 追加/更新したテストファイル、実行結果、CI ジョブ名、
  E2E は CI の playwright-report アーティファクト
・未チェック（- [ ]）が残っているとマージできない。自動テストで担保できない項目は
  確認者・確認内容を書いてからチェックする
-->

- [ ]

**エビデンス**:

<!-- 例: apps/api/src/__tests__/unit/xxx.test.ts を追加（8件パス）/ CI: Unit Test・Integration Test・E2E Test -->

## 📸 スクリーンショット

<!-- UI/UX 変更時は必須（PC + SP 375px、Before/After）。BE のみの変更は「該当なし」と記載 -->

| | Before | After |
|---|---|---|
| PC | | |
| SP（375px） | | |

## ✅ 規約・設計チェック

<!-- 空のまま提出禁止。評価基準: .github/git-conventions.md -->

- [ ] ユビキタス言語（Expense/Income）を遵守しているか
- [ ] 境界（Domain/Application/Infrastructure/Presentation）を跨ぐ不正な依存はないか
- [ ] ID（ulid）の生成・利用箇所は適切か
- [ ] マジックナンバーを排除し、定数化されているか
- [ ] UI/UX 変更がある場合、スクリーンショット（Before/After）を添付しているか

## 🔗 関連 Issue

<!-- 必須: 無いと Issue Link Check が失敗し、velocity-log の自動更新もスキップされる -->

- Closes #<!-- Issue番号 -->
- Sprint: <!-- スプリント番号 -->
