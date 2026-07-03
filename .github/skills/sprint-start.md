# /sprint-start — スプリント開始

## いつ使うか

新しいスプリントを開始するとき（スプリントプランニング）。
詳細フローは `.github/sprint-protocol.md` セクション 5「スプリントプランニングをして」を参照。

## 実行プロセス

### 1. スプリント番号を採番する（最初に必ず実行）

```bash
# velocity-log.json を読み込み next_sprint_number を取得・インクリメントして書き戻す
python3 -c "
import json
with open('.github/velocity-log.json') as f:
    data = json.load(f)
data['meta']['next_sprint_number'] += 1
with open('.github/velocity-log.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(data['meta']['next_sprint_number'] - 1)
"
```

採番後、main にコミット・プッシュする：
```bash
git add .github/velocity-log.json
git commit -m "chore(sprint): スプリント #N を開始する"
git push origin main
```

### 2. 直近 3 スプリントの平均ベロシティを計算する

`.github/velocity-log.json` の `sprints` から直近 3 件の `velocity` 平均を算出する（実績なければ初期値 6pt）。

### 3. PBI を選定する

全オープン Issue を取得し、以下の基準で今スプリントの PBI を選定する：

- `priority: P0/P1` を最優先
- `size: XS/S/M` を優先
- 合計ポイントが平均ベロシティ以内に収まる組み合わせ
- 依存関係（ブロッカー）を考慮

### 4. スプリントゴール・仮説を導出する

`.github/sprint-protocol.md` セクション 5 の形式でスプリントゴールと仮説をユーザーに提示する。

### 5. 承認後、PBI にラベルを付与する

```bash
gh issue edit {Issue番号} --add-label "sprint-backlog,in-progress"
```

選定した PBI ごとに実行する。`set-sprint-number.yml` が Sprint # フィールドを自動設定する。

## 制約

- velocity-log.json の更新は main への直接コミットを許可する（スプリント開始宣言）
- PBI 選定はユーザーの承認後に実行する
