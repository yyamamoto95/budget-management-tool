# 開発プロトコル（SSOT・唯一のエントリポイント）

**このファイルは開発体制ルールの SSOT である。開発に介入するすべての AI エージェント（Claude Code / Cursor / Copilot / Codex）は作業開始時にこのファイルを読み込むこと。**

---

## 1. 基本思想

> 「今欲しいシステム」を思いついたとき、技術的・体制的な壁でチャンスを逃すことをゼロにする。

- **1回の指示 = 1スプリント** — 人間の指示は不定期。指示を受けてから PR マージまでをひとつのサイクルとして完結させる
- **変更を前提とする** — 要件変更はデフォルト。スコープを調整してリリースを守る
- **AI が迷わない透明性** — どのエージェントが介入しても、本ファイルと SSOT マップだけで文脈を再構築できる
- **コスト最小** — インフラ以外の有料サービスは導入しない。自動化は GitHub Actions（無料枠）と Git フックで完結させる

---

## 2. 開発サイクル（1指示 = 1スプリント）

```
ユーザーの指示
  → 翻訳（意図 → 技術課題 → 対象ファイル）
  → ブランチ作成（main 最新から）
  → 影響調査 → 実装 → テスト追加 → 自己検証
  → PR 作成（テスト項目・エビデンス付き）
  → CI グリーン → マージ
  → サイクルタイム・ベロシティは GitHub Actions が自動記録
```

- **1 PBI = 1 スプリント = 1 PR**。1指示で完了しない場合は PBI を分割する（持ち越さない）
- スプリント番号・ベロシティ・サイクルタイムの記録はすべて自動（`measure-cycle-time.yml` / `update-velocity.yml` / `.github/velocity-log.json`）。**AI が velocity-log.json を手動編集するのは、複数 Issue を 1 PR でクローズした場合の補記のみ**（原則そうしない）

### 必須プロセス

コード修正・ファイル読み込みの**前に** 1〜3 を実行する：

1. **/branch** — `git fetch origin main` → local main 最新化 → `{type}/{description}` ブランチ作成。main が進んだら `git rebase origin/main`（`git merge main` 禁止）
2. **/translate** — 指示を「ユーザーの意図 → 技術課題 → 修正対象ファイル」へ翻訳し理解を言語化する
3. **/search** — 参照箇所・型依存を調査し影響範囲を特定する
4. **実装と自己検証** — lint + build → **テスト追加・更新（必須。テストなしのコードはマージしない）** → `pnpm test:unit` 全件パス。テスト規約の詳細は `.github/coding-conventions.md`「テストコード規約」（SSOT）
5. **PR 作成** — `.github/git-conventions.md` と PR テンプレートに従う。**Test plan セクションにテスト項目書とエビデンス（CI 結果・Playwright レポート）を必ず記載する**

### プロダクト判断基準

新機能・UI・文言の提案・実装前に `.github/product-identity.md` の「AI 開発ガイドライン」3項目（目的との一致・ユーザー負荷・誠実さ）を確認する。満たさないものは実装しない。

---

## 3. Git 権限（自律実行時）

| 操作 | 条件 |
|------|------|
| `git commit` / `git push` | 作業ブランチのみ。main 直接プッシュ禁止。規約: `.github/git-conventions.md` |
| `gh pr create` | PR 作成まで。マージはユーザーまたは CI に委ねる |
| `gh pr merge --squash --auto` | 「フルスプリントを回して」実行時のみ。CI グリーン後に自動マージ |
| `gh issue` (comment/edit/close) | ラベル操作・開始コメント・クロージング時のみ |

スプリントエージェントモード以外では、ユーザーの明示的な指示なくコミット・プッシュしない。

---

## 4. ボード運用・ラベル

ボード: https://github.com/users/yyamamoto95/projects/1

| ラベル | 意味 |
|--------|------|
| `backlog` / `sprint-backlog` | 未着手 / 今スプリント着手予定 |
| `in-progress` / `in-review` | 実装中（サイクルタイム計測開始）/ PR レビュー待ち |
| `priority: P0〜P3` | P0=即日（障害・脆弱性）/ P1=今スプリント / P2=次スプリント（デフォルト）/ P3=将来 |
| `size: XS/S/M/L/XL` | 1/2/3/5/8 pt。Issue 作成時に必ず付与 |

- **Issue 作成時は priority と size ラベルを必ず付与する**（`auto-priority.yml` が P2 を補完）
- 要件変更時は Must のみ残して他を `backlog` へ戻す（クローズしない）。スコープアウトした Issue には理由と代わりに優先した Issue 番号を1行コメントする
- Status フィールド等のボード同期は GitHub Actions（`project-board-sync.yml` ほか）が自動実行する

---

## 5. スプリントコマンド

ユーザーが以下を入力したとき、対応するフローを実行する。

### `スプリントを進めて`（メインループ）

作業可能な PBI がなくなるまで繰り返す：

1. PBI 選択（`in-progress` → `sprint-backlog` 最優先 → 自動選定）。`in-progress` ラベルを付与し、開始日時（JST）を Issue にコメントする（サイクルタイム計測の起点）
2. セクション 2 の必須プロセスを実行（ブランチ → 翻訳 → 影響調査 → 実装 → 自己検証）
3. PR 作成（本文に `Closes #N` と `Sprint: N`）→ `in-progress` を外し `in-review` を付与
4. 完了報告して次の PBI へ

**制約**: 同一 PBI で 3回ブロックされたら中断してユーザーに報告。仕様の不明点が生じたら確認を待つ。

### `スプリントプランニングをして`

1. `.github/velocity-log.json` の `meta.next_sprint_number` を +1 して main にコミット（`chore(sprint): スプリント #N を開始する`）。以降の PR 本文に `Sprint: N` を含める
2. 直近3スプリントの平均ベロシティから今回のキャパシティを算出し、priority・size・依存関係で PBI を選定
3. スプリントゴール（1文）・仮説（1文）・計画ポイントを提示し、承認後に `sprint-backlog` ラベルを付与、velocity-log.json の当スプリントエントリに記録

### `スプリントの状況を確認して`

`in-progress` / `in-review` の Issue と PR、直近3スプリントのベロシティ・size 別サイクルタイム（**中央値**。外れ値は別枠で要因分析対象として列挙）を表示する。

### `スプリントレビューをして`（ユーザーが求めたときのみ）

velocity-log.json から完了 PBI・達成率を集計し、`.github/retrospective-template.md` に基づき「Retro: Sprint #N」Issue を作成。Try アクションは `retro-action` + `backlog` + size ラベル付きの Issue にする。

### `フルスプリントを回して`（完全自律モード）

プランニング → 実装ループ → `gh pr merge --squash --auto` → マージ待機（最大15分ポーリング）→ クロージング（ラベル整理・Issue クローズ・レトロはユーザーが求めた場合のみ）→ サマリー報告、まで人間の介入なしに実行する。

- CI 失敗時はマージせず原因と修正案を報告して中断する
- UI の新規コンポーネント・画面デザイン変更は `apps/sandbox/` でプロトタイプを作りユーザーレビューを得てから本番実装する（Issue に詳細仕様・参照デザインが明記済みの場合、バグ修正、API ロジックのみの場合はスキップ可）

---

## 6. SSOT マップ

**常設ドキュメントは以下がすべてである（closed list）。矛盾時は上が優先。**

| 優先 | ファイル | 用途 |
|------|---------|------|
| 1 | `.github/sprint-protocol.md` | 開発体制・プロセス・権限・ドキュメント統治（本ファイル） |
| 2 | `.github/product-identity.md` | プロダクトのミッション・コンセプト・UI/トーン原則・AI 開発ガイドライン |
| 3 | `.github/PRD/product_requirements.md` / `user-stories.md` | 要件・優先度・BDD ユーザーストーリー |
| 4 | `.github/coding-conventions.md` | コーディング規約・DDD・テスト規約・Gemini レビューガイド |
| 5 | `.github/git-conventions.md` | コミットメッセージ・PR 生成規約 |
| 6 | `.github/design/data_model.md` / `figma-tokens.json` | データモデル・デザイントークン |
| 7 | `.github/arch/decision-log.md` / `auth-decision-log.md` | アーキテクチャ決定記録（ADR・追記のみ） |
| 8 | `.github/operation/README.md` | 運用手順（鍵管理・DB マイグレーション） |
| — | `.github/retrospective-template.md` | レトロ Issue テンプレート |
| — | `.github/skills/` / `.github/hooks/` | スキル・フックの実体（各 AI ディレクトリは薄いポインタのみ） |
| — | `README.md` | セットアップ・起動・テスト実行（人間向けクイックスタート） |
| — | `AGENTS.md` / `.claude/CLAUDE.md` / `.cursorrules` / `.github/copilot-instructions.md` / `GEMINI.md` | 各 AI 用ポインタ（本ファイルへの誘導のみ） |

機械可読データ（`velocity-log.json`, `docs/database/schema.dbml`, `packages/api-spec/openapi.yaml`）は自動生成・自動更新であり手動編集しない（velocity-log はセクション 2 の例外のみ）。

---

## 7. ドキュメント統治（肥大化の再発防止）

**原則: ドキュメントは負債。増やす前に、既存への追記・Issue 化・コードで表現できないかを必ず検討する。**

| 書きたい内容 | 置き場所 |
|-------------|---------|
| 一過性の分析・調査・改善提案・レビュー結果 | **GitHub Issue**（ファイルにしない） |
| アーキテクチャ・設計の決定 | `.github/arch/decision-log.md` に**追記**（新ファイル禁止） |
| 規約の追加・変更 | 既存 SSOT ファイルの該当セクションに**追記** |
| 実装の仕様 | コード・型・テスト・OpenAPI で表現する（別ファイルの仕様書を作らない） |
| 新しい常設ドキュメント | **ユーザーの明示的な承認が必要**。承認後、本ファイルの SSOT マップを同時に更新する |

**強制の仕組み**:

- CI の **Docs Guard**（`pr-checks.yml`）が新規 `.md` ファイルの追加を検出してブロックする。ユーザー承認済みの場合のみ PR に `docs-approved` ラベルを付けて通過させる
- ドキュメントの記述が実態と食い違っていることに気づいたら、その PR で即修正する（`docs:` コミット）。修正できない場合はユーザーに報告する
- スナップショット型ドキュメント（「〜時点の分析」「〜構成案」）は作らない。腐るだけである

---

## 8. ユーザー通知ルール（席外し時）

リモート起動セッションの完了・5分超タスクの完了・ユーザー判断待ちで停止した場合は、push 通知等でユーザーに能動通知する（通知手段を持たないエージェントは対象外）。本文は1行・200字以内・結論先頭（例: `PR #410 成功、マージ可`）。短時間タスクの完了や中間報告では通知しない。

---

## 9. このプロトコルの更新ルール

- 本ファイルの変更は `chore: sprint-protocol` のコミットで行い、PR で履歴を残す
- **AI が提案する改善案は、ユーザーの承認なしに本ファイルを書き換えてはならない**
- スキル・フックの実体は `.github/skills/` / `.github/hooks/` に置き、各 AI ツールディレクトリ（`.claude/commands/` はシンボリックリンク、`.cursor/skills/`・`.codex/skills/` は1〜3行のポインタ）には実体を複製しない。追加・削除時は本ファイルの SSOT マップと `.github/copilot-instructions.md` の一覧を更新する
