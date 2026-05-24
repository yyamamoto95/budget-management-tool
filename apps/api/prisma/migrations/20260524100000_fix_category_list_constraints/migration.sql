-- category_list の display_order 重複防止と budget_list.categoryId デフォルト値削除
--
-- 変更内容:
--   1. category_list に [balance_type, display_order] の複合ユニーク制約を追加
--      （収支タイプごとに表示順の重複を禁止する。規約: coding-conventions.md#マスターテーブル設計）
--   2. budget_list.categoryId の DEFAULT 1 を削除
--      （ID 1 は支出カテゴリ food であり、収入レコードで categoryId 未指定時に不整合データが作られる恐れがある）

-- ─── 1. category_list: [balance_type, display_order] 複合ユニーク制約 ──────────

ALTER TABLE `category_list`
  ADD CONSTRAINT `category_list_balance_type_display_order_key`
  UNIQUE (`balance_type`, `display_order`);

-- ─── 2. budget_list.categoryId: DEFAULT 1 を削除 ─────────────────────────────

ALTER TABLE `budget_list`
  MODIFY COLUMN `categoryId` INTEGER NOT NULL;
