import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ListView } from './ListView'
import {
  buildCategoryMap,
  fixtureRecentExpensesWithIncome,
} from '@/__fixtures__/dashboard'

/**
 * 明細ページのリストビュー。記録を日付グループで表示し、
 * 日ごとの収支合計（プラスはグリーン）とカテゴリバッジを表示する。
 */
const meta: Meta<typeof ListView> = {
  title: 'Records/ListView',
  component: ListView,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ListView>

/** 収入を含む複数日の明細（日合計の正負で色が変わる） */
export const MultipleDays: Story = {
  args: {
    expenses: fixtureRecentExpensesWithIncome,
    categoryMap: buildCategoryMap(),
  },
}

/** カテゴリ情報が引けない記録（「未分類」フォールバック表示） */
export const UnknownCategory: Story = {
  args: {
    expenses: fixtureRecentExpensesWithIncome.map((e) => ({
      ...e,
      categoryId: 999,
    })),
    categoryMap: buildCategoryMap(),
  },
}

/** 検索・絞り込みでヒットしない空状態 */
export const Empty: Story = {
  args: {
    expenses: [],
    categoryMap: buildCategoryMap(),
  },
}
