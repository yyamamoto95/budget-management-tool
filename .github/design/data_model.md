# データモデル設計 — 現状と改善案

**文書の役割**: `@BA` — PRD（`docs/PRD/product_requirements.md`）と整合するドメイン表現。  
**整合確認**: Serena（`find_symbol` / リポジトリ構造）に基づき 2026-03-29 時点のコードを反映。

---

## 1. 現行実装の整理（ソースオブトゥルース）

### 1.1 エンティティ一覧（API / TypeORM）

| 名前（コード上） | DB テーブル | 役割の実態 |
|------------------|-------------|------------|
| `User` | `user_list` | `userId`, `userName`, `password` |
| `Budget` | `budget_list` | **入出金の1行（取引レジャー）**として利用。名称は「Budget」だが、**Transaction に相当する行データ** |

**Serena 確認**: `api/src/data-source.ts` の `entities: [Budget, User]` のみ。`Transaction` / `Category` エンティティは **存在しない**。

### 1.2 `Budget`（`api/src/entity/Budget.ts`）

| カラム | 型 | 備考 |
|--------|-----|------|
| `id` | varchar (PK) | |
| `amount` | int | 金額 |
| `balanceType` | 0 \| 1 | 支出／収入（enum） |
| `categoryId` | number | **クライアント側カテゴリ番号への参照**（サーバ側に Category テーブルなし） |
| `content` | string? | メモ |
| `date` | string | 日付 |
| `createdDate` / `updatedDate` / `deletedDate` | Date | 作成・更新・論理削除 |

**ギャップ**: `userId` **なし** — ログイン（`/api/login`）とレジャーが **DB 上で結べていない**（マルチテナント・個人データ分離の欠如）。

### 1.3 `User`（`api/src/entity/User.ts`）

| カラム | 備考 |
|--------|------|
| `userId`, `userName`, `password` | 認証用の最小セット |

### 1.4 Category（クライアントのみ）

- `client/src/store/CategoryListSlice.ts` で **初期配列から生成**（食費・交通費…等）。
- `client/src/Model/Category.model.tsx` の `Category` クラスは **Redux 状態**として存在。
- **DB に永続化されない** — 別ブラウザ／デバイス間でカテゴリ定義が共有されない。

### 1.5 「Transaction」という名前のエンティティ

- **存在しない**。実務上は **`Budget` 1行 = 1取引** とみなすのが現状コードと一致する。

---

## 2. PRD とのギャップ

| PRD 要件 | 現状 | リスク |
|----------|------|--------|
| ユーザー別の家計・予算 | `budget_list` に `userId` なし | データ混在・プライバシー |
| ストッパー（週／月の残額） | 予算上限エンティティなし | 実装箇所がクライアント計算のみになりがち |
| カテゴリの一貫性・学習 | カテゴリがサーバにない | 自動カテゴリ・集計の単一ソースがない |
| 監査・分析 | 論理削除はある | ユーザー紐づけがないと分析単位が曖昧 |

---

## 3. 改善方針（概念モデル）

### 3.1 推奨するドメイン言葉

| 概念 | 説明 |
|------|------|
| **User** | 利用者（認証・設定の所有者） |
| **Transaction**（推奨リネーム候補） | 1件の入出金事実（現 `Budget` 行に相当） |
| **Category** | ユーザーまたはシステム定義の分類マスタ（支出／収入で種別を分けてもよい） |
| **Budget**（PRD上の意味） | **期間・カテゴリ等に紐づく上限／目標** — 現行の `Budget` エンティティ名とは衝突するため、**別エンティティ `BudgetLimit` / `SpendingCap` 等**として切り出すことを推奨 |

命名: 既存 `Budget` テーブルを **`Transaction` にリネーム**するマイグレーションか、段階的に **新テーブル追加＋移行**のどちらかを `@Architect` が決定する。

### 3.2 目標スキーマ（論理）

```
User 1 ── * Transaction
User 1 ── * Category（ユーザー拡張可）
User 1 ── * BudgetLimit（週次・月次、カテゴリ任意）
Category 1 ── * Transaction
BudgetLimit ──（集計）── Transaction / 集計ビュー とストッパー連動
```

- **BudgetLimit**（仮称）: `userId`, `period`（週開始日・月）, `categoryId` nullable, `amountCap`, `currency`, `timezone` 等。
- **Transaction**: 現 `Budget` の列＋**必須 `userId`**＋`categoryId` は **Category.id（FK）** へ。

### 3.3 カテゴリ ID の移行

- 現状: クライアント生成の連番とサーバ `categoryId` が暗黙に一致している前提。
- 改善: **サーバマスタ**を正とし、シードまたはユーザー作成カテゴリを `Category` に保存。クライアントは API から一覧取得。

### 3.4 ストッパー・インサイト向けの列・派生

- 集計: `Transaction` を user + 期間 + category で SUM。
- 浪費パターン: 曜日・時間帯（将来）、メモテキスト（将来の NLP）は後追い。
- プライバシー: 分析用の匿名化ポリシーは NFR と合わせて別紙。

---

## 4. マイグレーション観点（概要）

1. `user_list` と `budget_list` の関連付け（`userId` 追加、既存データの扱いを決める）。
2. `Category` テーブル作成＋初期データ投入（現 `outgoTypes` / `incomeTypes` 相当）。
3. `Budget` → `Transaction` への整理と **`BudgetLimit` 新規**。
4. API / フロントの用語・型の一貫更新。

---

## 5. Serena による確認メモ

- **実施**: `find_symbol`（`api/src/entity/User`, `Budget`）、`data-source` の entities 一覧、`CategoryListSlice` / `Budget` クライアントモデルのgrep。
- **結論**: 現行は **User + Budget（取引）** の2エンティティ中心。**Category は DB なし**。**Transaction という名前のエンティティはなく**、PRD の「User, Transaction, Category, Budget」を満たすには **モデル分割と命名整理が必須**。

---

## 6. 参照

- PRD: `docs/PRD/product_requirements.md`
- UI 原則: `.github/product-identity.md`（デザイン原則・情報階層）
