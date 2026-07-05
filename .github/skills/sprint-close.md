# /sprint-close — スプリントクロージング

## いつ使うか

スプリントの全 PBI PR がマージされたとき。
詳細フローは `.github/sprint-protocol.md` セクション 8「フルスプリントを回して」のクロージング部分を参照。

## 実行プロセス

### 1. ラベル整理

完了 Issue から `in-review`・`sprint-backlog` を除去する：

```bash
gh issue edit {Issue番号} --remove-label "in-review,sprint-backlog"
```

### 2. Issue クローズ

PR の `Closes #N` 自動クローズが機能しなかった Issue を明示的にクローズする：

```bash
gh issue close {Issue番号} --comment "スプリント #N 完了。PR マージにより対応済み。"
```

### 3. velocity-log.json 同期確認

`.github/velocity-log.json` に今スプリントの実績が記録されているか確認する。
未記録の場合は以下の形式で追記する：

```json
{
  "sprint": N,
  "velocity": {完了ポイント合計},
  "completed_pbis": [{Issue番号}, ...],
  "cycle_times": {}
}
```

### 4. レトロスペクティブを生成する

`.github/retrospective-template.md` を読み込み、以下の内容で Issue を作成する：

```bash
gh issue create \
  --title "Retro: Sprint #N" \
  --label "retro,priority: P2" \
  --body "{retrospective_body}"
```

レトロ本文には今スプリントの KPT（Keep/Problem/Try）を含める。

### 5. プロジェクトボードのステータスを Done に更新する

GitHub Projects API で完了 PBI の Status フィールドを "Done" に設定する（`project-board-sync.yml` が対応していない場合は手動で実施）。

### 6. SSOT ドキュメントの棚卸し（既存セレモニーに便乗）

新しい定例を作らず、スプリントクロージング時に SSOT の鮮度を軽く点検する。

```bash
# 6a. リンク切れ検出（.github/・docs/ 参照が実在するか）
pnpm docs:check-links

# 6b. SSOT マップに未掲載の md を洗い出す（親ディレクトリ経由のカバレッジも考慮）
map_tokens=$(grep -oE '`\.github/[A-Za-z0-9._/-]+`' .github/sprint-protocol.md | tr -d '`' | sed 's:/$::' | sort -u)
find .github -name '*.md' | grep -vE 'skills/|workflows/|ISSUE_TEMPLATE/|README\.md|PULL_REQUEST_TEMPLATE\.md' | while read -r f; do
  covered=""; p="$f"
  while [ "$p" != "." ] && [ "$p" != ".github" ]; do
    echo "$map_tokens" | grep -qxF "$p" && { covered=1; break; }
    p=$(dirname "$p")
  done
  [ -z "$covered" ] && echo "UNCOVERED: $f"
done
```

- 6a が失敗したらリンク切れを修正する（`docs: ` コミット）
- 6b の差分（マップ未掲載の文書）が出たら、SSOT マップへの追加 or 統合・削除を判断する
- 「一時点の記録 md」が増えていないか確認し、あれば Issue/PR/ADR へ移して削除する

### 7. クロージングサマリーを報告する

- 完了 PBI 一覧とベロシティ実績
- 次スプリントへの持ち越し Issue（あれば）
- レトロ Issue の URL
- SSOT 棚卸し結果（リンク切れ・マップ差分の有無）

## 制約

- 全 PR がマージ済みであることを確認してからクロージングを開始する
- velocity-log.json の更新は必ず main にコミット・プッシュする
