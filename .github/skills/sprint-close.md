# /sprint-close — スプリントクロージング

## いつ使うか

スプリントの全 PBI PR がマージされたとき。
詳細フローは `.github/sprint-protocol.md` セクション 5「フルスプリントを回して」のクロージング部分を参照。

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

### 6. クロージングサマリーを報告する

- 完了 PBI 一覧とベロシティ実績
- 次スプリントへの持ち越し Issue（あれば）
- レトロ Issue の URL

## 制約

- 全 PR がマージ済みであることを確認してからクロージングを開始する
- velocity-log.json の更新は必ず main にコミット・プッシュする
