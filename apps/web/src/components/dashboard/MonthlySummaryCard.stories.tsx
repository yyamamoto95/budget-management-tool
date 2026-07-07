import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MonthlySummaryCard } from './MonthlySummaryCard'

/**
 * ホームの「今月のサマリー」。収支差を主役に、
 * 収入・支出の内訳、先月比（日割り平均）、貯蓄率を表示する。
 * 収支差の正負と先月比の増減でカラーが切り替わる。
 */
const meta: Meta<typeof MonthlySummaryCard> = {
  title: 'Dashboard/MonthlySummaryCard',
  component: MonthlySummaryCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MonthlySummaryCard>

/** 黒字 + 先月より支出減（すべてポジティブな状態） */
export const SurplusSaving: Story = {
  args: {
    monthSummary: { expense: 82000, income: 250000 },
    lastMonthExpense: 190000,
  },
}

/** 赤字（支出が収入を上回る月） */
export const Deficit: Story = {
  args: {
    monthSummary: { expense: 280000, income: 250000 },
    lastMonthExpense: 190000,
  },
}

/** 黒字だが先月より支出増（先月比がレッド表示） */
export const SurplusButOverspending: Story = {
  args: {
    monthSummary: { expense: 200000, income: 250000 },
    lastMonthExpense: 60000,
  },
}

/** 収入の記録がまだない月（貯蓄率 0% 表示の境界ケース） */
export const NoIncome: Story = {
  args: {
    monthSummary: { expense: 45000, income: 0 },
    lastMonthExpense: 120000,
  },
}
