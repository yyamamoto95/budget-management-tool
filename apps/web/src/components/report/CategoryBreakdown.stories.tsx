import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CategoryBreakdown } from './CategoryBreakdown'
import { EXPENSE_CATEGORY_TOKENS } from '@budget/common'

/**
 * レポートの「カテゴリ別支出」。積み上げカラーバーと
 * カテゴリごとの構成比プログレスバーで支出内訳を可視化する。
 */
const meta: Meta<typeof CategoryBreakdown> = {
  title: 'Report/CategoryBreakdown',
  component: CategoryBreakdown,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof CategoryBreakdown>

const categories = [
  { label: '食費', amount: 42300, color: EXPENSE_CATEGORY_TOKENS.food.color },
  { label: '外食', amount: 28900, color: EXPENSE_CATEGORY_TOKENS.dining.color },
  { label: '日用品', amount: 12100, color: EXPENSE_CATEGORY_TOKENS.daily.color },
  { label: '交通費', amount: 8400, color: EXPENSE_CATEGORY_TOKENS.transport.color },
  { label: '趣味', amount: 5200, color: EXPENSE_CATEGORY_TOKENS.leisure.color },
]

/** 5カテゴリの標準的な内訳（万円表記への切替も含む） */
export const Standard: Story = {
  args: {
    categories,
    totalExpense: categories.reduce((s, c) => s + c.amount, 0),
  },
}

/** 1カテゴリに支出が集中しているケース */
export const SingleDominant: Story = {
  args: {
    categories: [
      { label: '住居費', amount: 90000, color: EXPENSE_CATEGORY_TOKENS.housing.color },
      { label: '食費', amount: 6000, color: EXPENSE_CATEGORY_TOKENS.food.color },
    ],
    totalExpense: 96000,
  },
}

/** 支出ゼロの月（0% 境界ケース） */
export const NoExpense: Story = {
  args: {
    categories: [],
    totalExpense: 0,
  },
}
