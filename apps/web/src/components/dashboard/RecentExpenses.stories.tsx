import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RecentExpenses } from './RecentExpenses'
import {
  fixtureAllCategories,
  fixtureRecentExpenses,
  fixtureRecentExpensesWithIncome,
} from '@/__fixtures__/dashboard'

/**
 * ホームの「最近の記録」。直近3日分を日付グループで表示し、
 * カテゴリアイコン・日合計・収入の色分けを行う。
 */
const meta: Meta<typeof RecentExpenses> = {
  title: 'Dashboard/RecentExpenses',
  component: RecentExpenses,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof RecentExpenses>

/** 3日分の支出記録（今日・昨日・一昨日のグループ表示） */
export const ThreeDays: Story = {
  args: {
    recentExpenses: fixtureRecentExpenses,
    allCategories: fixtureAllCategories,
  },
}

/** 収入（給料）を含む記録: 金額がグリーンの + 表示になる */
export const WithIncome: Story = {
  args: {
    recentExpenses: fixtureRecentExpensesWithIncome,
    allCategories: fixtureAllCategories,
  },
}

/** 記録がまだ1件もない空状態 */
export const Empty: Story = {
  args: {
    recentExpenses: [],
    allCategories: fixtureAllCategories,
  },
}
