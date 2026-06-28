# E2E テスト（Playwright + Page Object Model）

ユーザーの主要ユースケース（UI 操作 → Server Action → API → DB → UI フィードバック）が
**実際に繋がっていること**を検証する End-to-End テスト。

コンポーネント UT（Vitest+RTL）と API 統合テスト（Vitest+実 DB）の "継ぎ目" に生じる
不具合（例: 保存が静かに失敗する）を検出する層に位置づける。

## 設計方針

- **重み付け**: Testing Trophy。バリデーション網羅・境界値は API 統合テストが担保するため、
  E2E では再検証せず「経路が繋がっていること」と「主要ユースケース」に絞る（二重検証を避ける）。
- **Page Object Model (POM)**: 画面ごとにセレクタと操作を `pages/` の Page Object へ集約する。
  spec は Page Object のメソッドだけを呼び、生のセレクタを書かない。
  → UI 変更時の修正範囲を Page Object に閉じ込め、横展開・保守性を担保する。
- **再現性**: 破壊的操作（保存等）は `beforeEach` で元の状態を退避し `afterEach` で復元する。
  繰り返し実行しても同結果になる決定的なテストにする。

## ディレクトリ構成

```
e2e/
├─ auth.setup.ts        # ログイン → storageState 保存（全 spec で再利用）
├─ pages/
│  ├─ BasePage.ts       # goto / reload / 表示待機の共通基底
│  └─ <Feature>Page.ts  # 画面ごとの Page Object
├─ <feature>.spec.ts    # シナリオ（Page Object を呼ぶだけ）
└─ README.md
```

## 新しいフローテストの追加手順（横展開テンプレ）

1. **アクセシブル名を用意する** — 操作対象に `aria-label` 等の安定した名前を付ける
   （`getByRole` / `getByLabel` で選択できるようにする。CSS クラスや構造依存の
   セレクタは UI 変更で壊れるため避ける）。
2. **Page Object を作る** — `pages/<Feature>Page.ts` で `BasePage` を継承し、
   `path` と `waitForReady()`、画面固有の操作・検証メソッドを実装する。
3. **spec を書く** — `<feature>.spec.ts` に「〜のとき、〜になる」形式でシナリオを記述し、
   破壊的操作は `beforeEach` 退避 / `afterEach` 復元で再現性を担保する。

## 実行方法

### 前提セットアップ（初回・スキーマ変更後は必須）

```bash
pnpm db:start                              # MySQL 起動
pnpm db:migrate:deploy                     # マイグレーション適用
pnpm --filter @budget/api exec prisma generate   # Prisma Client 生成（★スキーマ変更後は必須）
pnpm --filter @budget/api run seed         # ゲストユーザー(Guest)投入（冪等）
```

> ⚠️ **`prisma generate` を忘れると Prisma Client が古いままになり、新カラム
> （例: `fixedExpensesDetail`）を含む保存が API 500 になる。** スキーマ変更後・
> API 起動前に必ず実行する。`pnpm dev` / CI ビルドでは codegen 経由で自動実行される。

### 起動と実行

```bash
# DB・API(:5000)・web(:3000) を起動（baseURL=http://localhost:3000）
pnpm dev

# 別ターミナルで
pnpm test:e2e                 # 全 E2E
pnpm test:e2e settings.spec   # 個別

# 認証は既定でゲストログイン（認証情報不要）。
# 専用ユーザーを使う場合は E2E_USER_ID / E2E_PASSWORD を指定する。
```
