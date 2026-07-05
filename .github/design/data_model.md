# データモデル設計 — 現状と改善案

**文書の役割**: `@BA` — PRD（`.github/spec/product.md`）と整合するドメイン表現。  
**整合確認**: `apps/api/prisma/schema.prisma`（現行 Prisma スキーマ）に基づき反映。

---

## 1. 現行実装の整理（ソースオブトゥルース）

現行実装は `apps/api`（Prisma + MySQL）。スキーマの唯一の真実の源泉は `apps/api/prisma/schema.prisma`。

### 1.1 エンティティ一覧（Prisma モデル）

| モデル（コード上） | DB テーブル | 役割の実態 |
|------------------|-------------|------------|
| `UserList` | `user_list` | 認証アカウント（`userId`, `userName`, `email`, `password`, `role`, `status`） |
| `CategoryList` | `category_list` | カテゴリマスター（`balanceType` で支出／収入を区別、システム定義＋論理削除フラグ） |
| `BudgetList` | `budget_list` | **入出金の1行（取引レジャー）**。名称は「Budget」だが実態は取引行データ。`userId` / `categoryId` で FK 連携 |
| `RefreshToken` | `refresh_tokens` | JWT リフレッシュトークン |
| `SecurityQuestionPreset` | `security_question_presets` | パスワードリカバリ用「秘密の質問」プリセット |
| `UserSecurityAnswer` | `user_security_answers` | ユーザーが選択した秘密の質問と回答（bcrypt ハッシュ） |
| `UserSettings` | `user_settings` | ユーザー設定（総資産・月次収入・給料日・固定費・初回設定完了フラグ） |
| `PasswordResetToken` | `password_reset_tokens` | パスワードリセット用一時トークン |
| `LlmUsage` | `llm_usage` | LLM 使用ログ（使用制限・コスト管理用） |

### 1.2 `BudgetList`（`budget_list`）

| カラム | 型 | 備考 |
|--------|-----|------|
| `id` | VarChar (PK) | |
| `amount` | Int | 金額 |
| `balanceType` | 0 \| 1 | 支出／収入 |
| `userId` | VarChar (FK) | `user_list.userId` へ FK（`onDelete: Cascade`）。ユーザー別にデータ分離済み |
| `categoryId` | Int (FK) | `category_list.id` へ FK |
| `content` | VarChar? | メモ |
| `date` | VarChar | 日付 |
| `createdDate` / `updatedDate` / `deletedDate` | DateTime | 作成・更新・論理削除 |

### 1.3 `UserList`（`user_list`）

| カラム | 備考 |
|--------|------|
| `userId`（PK）, `userName`, `password` | 認証用の最小セット |
| `email`（unique, nullable） | パスワードリカバリ・連絡用 |
| `role`（ADMIN/USER/GUEST）, `status`（ACTIVE/INACTIVE） | 権限・状態管理 |
| `budgets` | `BudgetList` への 1:多リレーション |

### 1.4 `CategoryList`（`category_list`）

- カテゴリは **DB マスターとして永続化**（旧クライアント Redux 実装から移行済み）。
- `balanceType`（0=支出 / 1=収入）で種別を分け、`key`＋`balanceType`・`balanceType`＋`displayOrder` に一意制約。
- `isSystem`（システム定義）・`isDeleted`（論理削除）で管理。`BudgetList.categoryId` から FK 参照される。

### 1.5 「Transaction」という名前のエンティティ

- **存在しない**。実務上は **`BudgetList` 1行 = 1取引** とみなすのが現状コードと一致する。

---

## 2. PRD とのギャップ（解消状況）

| PRD 要件 | 現状 | 状態 |
|----------|------|------|
| ユーザー別の家計・予算 | `budget_list.userId` を FK で保持（`onDelete: Cascade`） | ✅ 解消 |
| カテゴリの一貫性・学習 | `category_list` をサーバマスターとして保持 | ✅ 解消 |
| 監査・分析 | 論理削除＋ユーザー紐づけあり | ✅ 解消 |
| ストッパー（週／月の残額） | `user_settings` に固定費・月次収入等はあるが、期間別の予算上限エンティティは未導入 | ⚠️ 一部（残額はアプリ計算） |

---

## 3. 改善方針（概念モデル）

> **実装状況（現行 Prisma）**: `userId` 連携・`CategoryList` マスターは実装済み。`Budget`→`Transaction` リネームと `BudgetLimit`（期間別上限）は未実施の提案として残す。

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

- ✅ **実装済み**: `category_list` をサーバマスターとし、`budget_list.categoryId` が FK 参照。クライアントは API から一覧取得する構成へ移行済み。

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

## 5. 確認メモ

- **実施**: `apps/api/prisma/schema.prisma` のモデル定義を確認。
- **結論**: 旧 `api/`（TypeORM）+ `client/`（Redux）実装から `apps/api`（Prisma）へ移行済み。`userId` の FK 連携・`CategoryList` マスターの DB 永続化は**実装済み**。一方、PRD 上の「予算上限（`BudgetLimit`）」エンティティと `Budget`→`Transaction` の命名整理は**未実施**。

---

## 6. 参照

- PRD: `.github/spec/product.md`
- UI: `.github/design/ui_concept.md`
- スキーマ SSOT: `apps/api/prisma/schema.prisma`
