# @yyamamoto95/flow-wireframe

**業務フロー定義（JSON 1ファイル）から、非エンジニアにも読める静的 HTML ワイヤーフレーム（1ファイル）を生成する**ライブラリ / CLI。

ふるまい駆動開発（BDD）の「ユーザーストーリー → 画面 → 操作 → 結果」のつながりを、企画・デザイン・開発・ビジネスの全員が同じ資料で確認できるようにする。

## 特徴

- **静的 HTML 1ファイル**: JavaScript・外部フォント・外部画像に一切依存しない。`file://` で直接開ける・メール添付できる・S3 や社内 Wiki に置くだけで共有できる
- **非エンジニアでもわかる**: 画面の縮小図と矢印で「誰が・どの画面で・何をすると・どうなるか」を表現。冒頭に「この資料の読み方」を自動挿入
- **直感的**: ボタン・リンクの `goto` はクリック可能なホットスポットになり、アンカーリンクだけで画面遷移を体験できる（遷移先は CSS `:target` でハイライト）
- **再現性**: タイムスタンプ等を埋め込まない決定的レンダリング。同じ定義からは常にバイト単位で同じ HTML が生成され、git 管理・差分レビューに向く
- **BDD トレーサビリティ**: フロー ID（例 `US-301`）とGherkin（前提・操作・結果）をワイヤーフレームに併記し、ユーザーストーリー・E2E テストと対応づけられる

## 使い方

```bash
# ひな形を作る
npx @yyamamoto95/flow-wireframe init flow.json

# 定義を検証する（参照切れなどを日本語で報告）
npx @yyamamoto95/flow-wireframe check flow.json

# HTML を生成する
npx @yyamamoto95/flow-wireframe build flow.json -o wireframe.html
```

ライブラリとしても使える:

```ts
import { renderHtml, validate } from "@yyamamoto95/flow-wireframe";

const html = renderHtml(definition); // 不正な定義は日本語のエラーで throw
```

## フレームワークとしての使い方（再現可能な運用プロセス）

どのプロジェクトでも同じ手順で業務フローを見える化できるよう、運用を4ステップに固定する。

```
1. ストーリー選定   BDD のユーザーストーリー（US-nnn 等）から見える化する単位を選ぶ
2. 画面の定義       screens に画面と UI 部品を書く（mobile / desktop を選択）
3. フローの定義     flows に「画面ステップ」と「画面を持たない処理ステップ(process)」を並べる
4. 検証と生成       check で整合性を検証 → build で HTML 生成 → 関係者レビュー
```

- **定義（JSON）を git 管理し、生成物（HTML）はいつでも再生成できる**。出力は決定的なので、定義の diff がそのまま仕様変更のレビューになる
- 定義ファイル先頭に `$schema` を書くと、VS Code 等のエディタで**入力補完と機械検証**が効く（スキーマは本パッケージの `schema/flow-wireframe.schema.json` に同梱）

```jsonc
{ "$schema": "https://unpkg.com/@yyamamoto95/flow-wireframe/schema/flow-wireframe.schema.json", ... }
```

- フロー ID は「トレーサビリティの鍵」: ユーザーストーリー → ワイヤーフレーム → Issue / PR → E2E スペックを同じ ID で貫く

### 適用実績

| プロジェクト | 特徴 | 使った機能 |
|--------------|------|-----------|
| 家計簿アプリ | モバイル UI・BDD ストーリー駆動 | スマホ枠、Gherkin 表、注釈、nav 遷移 |
| Tech Blog Aggregator | デスクトップ UI・自動化パイプライン | ブラウザ枠(`layout: desktop`)、処理ステップ(`process`)、外部リンク(`external`) |

## 定義ファイルの構造

```jsonc
{
  "title": "ドキュメント名",
  "screens": [            // 画面カタログ
    {
      "id": "home",       // フローや goto から参照する ID
      "name": "ホーム画面",
      "note": "画面の目的",
      "layout": "mobile", // mobile(スマホ枠 320px) / desktop(ブラウザ枠 560px)
      "elements": [       // 上から順に描画される UI 部品
        { "type": "header", "label": "ホーム" },
        { "type": "card", "label": "今日使える残り予算", "value": "¥1,280" },
        { "type": "button", "label": "＋ 記録する", "goto": "record" }
      ]
    }
  ],
  "flows": [              // 業務フロー（ユーザーストーリー単位）
    {
      "id": "US-301",     // BDD ストーリーとのトレーサビリティ ID
      "name": "支出を素早く記録する",
      "actor": "利用者",
      "scenario": {       // Gherkin（前提・操作・結果）
        "given": ["ユーザーがアプリを開いている"],
        "when": ["クイック入力でカテゴリを選んで金額を入力する"],
        "then": ["記録が完了しフィードバックが得られる"]
      },
      "steps": [          // 画面の並びと操作（矢印になる）
        { "screen": "home", "action": "「＋ 記録する」をタップ" },
        { "screen": "record", "result": "登録完了" }
      ]
    },
    {
      "id": "BATCH-001",  // 画面を持たない自動処理も同じ語彙で書ける
      "name": "毎朝のダイジェスト生成",
      "actor": "システム",
      "steps": [
        { "process": "RSS収集", "action": "スコアリングして選抜" },
        { "process": "要約と配信", "action": "翌朝ユーザーが確認" },
        { "screen": "home", "result": "画面に反映される" }
      ]
    }
  ]
}
```

### UI 部品（elements）の種類

| type | 用途 | 主な属性 |
|------|------|---------|
| `header` | 画面見出し | `label` |
| `text` | 説明文 | `label`, `muted` |
| `input` | 入力欄 | `label`, `placeholder`, `secret` |
| `button` | ボタン | `label`, `goto`, `variant`(`primary`/`secondary`/`danger`), `external`(↗) |
| `link` | テキストリンク | `label`, `goto`, `external`(↗) |
| `list` | 明細・箇条書き | `label`, `items` |
| `card` | 数値カード | `label`, `value`, `caption` |
| `chart` | グラフのプレースホルダ | `label`, `kind`(`bar`/`line`/`donut`) |
| `image` | 画像のプレースホルダ | `label` |
| `badge` | 状態ラベル | `label`, `tone`(`good`/`caution`/`neutral`) |
| `choice` | タブ・セグメント選択 | `label`, `items`, `selected` |
| `nav` | ナビゲーション | `items`(文字列 or `{label, goto}`), `selected` |
| `divider` | 区切り線 | — |

すべての部品は `note`（①②…の注釈）を持てる。注釈は画面下の一覧に対応番号つきで表示される。

## サンプル

家計簿アプリの BDD ユーザーストーリー（`.github/spec/user-stories.md`）を題材にしたサンプルが `examples/` にある。

```bash
pnpm example   # examples/kakeibo.flow.json → examples/kakeibo.wireframe.html
```

## npm への公開

```bash
pnpm build
npm publish --access public   # publishConfig.access は設定済み
```

## 設計方針

1. **定義と出力は 1 対 1** — レビューは JSON の diff で、確認は HTML で行う
2. **語彙を増やしすぎない** — UI 部品は「打ち合わせで手描きするレベル」の粒度に留め、忠実なビジュアルデザインは Figma 等に譲る
3. **壊れ方を親切に** — 参照切れ・ID 重複などは生成前に全件、日本語で報告する
