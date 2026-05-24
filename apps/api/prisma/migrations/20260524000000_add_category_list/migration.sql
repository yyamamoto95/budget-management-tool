-- カテゴリマスターテーブルの追加と既存データのマイグレーション
--
-- 変更内容:
--   1. category_list テーブルを新規作成
--   2. 初期カテゴリデータ（支出16件 + 収入8件）を投入
--   3. budget_list.categoryId を旧 Int 連番から新 ID に変換
--   4. budget_list に category_list への外部キー制約を追加
--
-- 旧→新 カテゴリ ID マッピング（支出 balanceType=0）:
--   旧 0 (その他・不明)   → 新 15 (other)
--   旧 1 (食費・スーパー) → 新  1 (food)
--   旧 2 (外食・カフェ)   → 新  2 (dining)
--   旧 3 (日用品)         → 新  4 (daily)
--   旧 4 (通信・サブスク) → 新  6 (telecom)
--   旧 5 (住居・光熱費)   → 新  7 (housing)
--   旧 6 (教育・こども)   → 新 14 (education)
--   旧 7 (美容・衣類)     → 新 12 (beauty)
--   旧 8 (クルマ・交通)   → 新  3 (transport)
--   旧 9 (医療・保険)     → 新  9 (medical)
--
-- 旧→新 カテゴリ ID マッピング（収入 balanceType=1）:
--   旧 0 (その他)       → 新 23 (other income)
--   旧 1 (給料)         → 新 17 (salary)
--   旧 2 (賞与)         → 新 18 (bonus)
--   旧 3 (副業)         → 新 19 (sideJob)
--   旧 4 (所得)         → 新 23 (other income)
--   旧 5 (年金)         → 新 21 (pension)
--   旧 6 (おこづかい)   → 新 23 (other income)

-- ─── 1. category_list テーブル作成 ───────────────────────────────────────────

CREATE TABLE `category_list` (
    `id`           INT           NOT NULL AUTO_INCREMENT,
    `key`          VARCHAR(50)   NOT NULL,
    `name`         VARCHAR(100)  NOT NULL,
    `color`        VARCHAR(7)    NOT NULL,
    `bg`           VARCHAR(7)    NOT NULL,
    `balance_type` INT           NOT NULL,
    `display_order` INT          NOT NULL,
    `is_system`    BOOLEAN       NOT NULL DEFAULT TRUE,
    `is_deleted`   BOOLEAN       NOT NULL DEFAULT FALSE,
    `created_at`   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at`   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `category_list_key_balance_type_key` (`key`, `balance_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── 2. 初期カテゴリデータ投入 ────────────────────────────────────────────────
-- 支出カテゴリ (balanceType=0) — ID 1〜16

INSERT INTO `category_list` (`key`, `name`, `color`, `bg`, `balance_type`, `display_order`) VALUES
  ('food',         '食費',       '#f18840', '#fef5ee', 0,  1),
  ('dining',       '外食',       '#fb923c', '#fff4ee', 0,  2),
  ('transport',    '交通費',     '#60a5fa', '#eff6ff', 0,  3),
  ('daily',        '日用品',     '#38bdf8', '#f0f9ff', 0,  4),
  ('utility',      '光熱費',     '#fbbf24', '#fffbeb', 0,  5),
  ('telecom',      '通信費',     '#818cf8', '#eef2ff', 0,  6),
  ('housing',      '住宅費',     '#d97706', '#fffbeb', 0,  7),
  ('tax',          '税金',       '#64748b', '#f8fafc', 0,  8),
  ('medical',      '医療費',     '#fb7185', '#fff1f2', 0,  9),
  ('insurance',    '保険',       '#f472b6', '#fdf2f8', 0, 10),
  ('clothing',     '衣類',       '#a78bfa', '#f5f3ff', 0, 11),
  ('beauty',       '美容費',     '#e879f9', '#fdf4ff', 0, 12),
  ('leisure',      '趣味',       '#c084fc', '#faf5ff', 0, 13),
  ('education',    '教育費',     '#eab308', '#fefce8', 0, 14),
  ('other',        'その他',     '#94a3b8', '#f8fafc', 0, 15),
  ('unclassified', '未分類',     '#94a3b8', '#f1f5f9', 0, 16);

-- 収入カテゴリ (balanceType=1) — ID 17〜24

INSERT INTO `category_list` (`key`, `name`, `color`, `bg`, `balance_type`, `display_order`) VALUES
  ('salary',       '給料',       '#2dd4bf', '#f0fdfa', 1,  1),
  ('bonus',        '賞与',       '#10b981', '#ecfdf5', 1,  2),
  ('sideJob',      '副業',       '#22c55e', '#f0fdf4', 1,  3),
  ('benefit',      '手当',       '#0ea5e9', '#f0f9ff', 1,  4),
  ('pension',      '年金',       '#14b8a6', '#f0fdfa', 1,  5),
  ('investment',   '投資・配当', '#34d399', '#ecfdf5', 1,  6),
  ('other',        'その他',     '#94a3b8', '#f8fafc', 1,  7),
  ('unclassified', '未分類',     '#94a3b8', '#f1f5f9', 1,  8);

-- ─── 3. budget_list.categoryId を新 ID に変換 ──────────────────────────────────
-- 支出レコード (balanceType=0)

UPDATE `budget_list` SET `categoryId` = CASE `categoryId`
  WHEN 1 THEN 1   -- 食費・スーパー → food
  WHEN 2 THEN 2   -- 外食・カフェ   → dining
  WHEN 8 THEN 3   -- クルマ・交通   → transport
  WHEN 3 THEN 4   -- 日用品         → daily
  WHEN 5 THEN 7   -- 住居・光熱費   → housing
  WHEN 4 THEN 6   -- 通信・サブスク → telecom
  WHEN 9 THEN 9   -- 医療・保険     → medical
  WHEN 7 THEN 12  -- 美容・衣類     → beauty
  WHEN 6 THEN 14  -- 教育・こども   → education
  WHEN 0 THEN 15  -- その他・不明   → other
  ELSE 16         -- 未知 → unclassified
END
WHERE `balanceType` = 0;

-- 収入レコード (balanceType=1)

UPDATE `budget_list` SET `categoryId` = CASE `categoryId`
  WHEN 1 THEN 17  -- 給料       → salary
  WHEN 2 THEN 18  -- 賞与       → bonus
  WHEN 3 THEN 19  -- 副業       → sideJob
  WHEN 5 THEN 21  -- 年金       → pension
  WHEN 4 THEN 23  -- 所得       → other income
  WHEN 6 THEN 23  -- おこづかい → other income
  WHEN 0 THEN 23  -- その他     → other income
  ELSE 24         -- 未知       → unclassified income
END
WHERE `balanceType` = 1;

-- ─── 4. budget_list に外部キー制約を追加 ──────────────────────────────────────

ALTER TABLE `budget_list`
  ADD CONSTRAINT `budget_list_categoryId_fkey`
  FOREIGN KEY (`categoryId`) REFERENCES `category_list`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
