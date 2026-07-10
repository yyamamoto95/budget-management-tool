import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { InvestmentCapacityCard } from './InvestmentCapacityCard'

/**
 * ホームの「投資余力」カード（#543 / #545 / investment-business-basics.md MVP スコープ 1）。
 * 「今月投資に回してよい上限」を数字主役・事実のみのトーンで表示する。
 * 「今月は投資を控える月」も正しい結果として肯定形で表示する（急かさない・煽らない）。
 * 診断は @budget/common の calculateInvestmentCapacity に委譲している。
 * 算出不能（総資産未設定・記録不足）のときは何も描画しない（生活余力カード側が案内する）。
 */
const meta: Meta<typeof InvestmentCapacityCard> = {
  title: 'Dashboard/InvestmentCapacityCard',
  component: InvestmentCapacityCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof InvestmentCapacityCard>

/** 防衛資金充足（200%）・月次黒字 → 上限 3 万円・リスク許容度 中 */
export const Investable: Story = {
  args: {
    livingMargin: {
      totalAssets: 2_880_000,
      avgDailyExpense: 8_000,
      monthlyIncome: 300_000,
      recordedDays: 30,
    },
  },
}

/** 防衛資金が未充足（83%）→ 黒字があっても「今月は投資を控える月」 */
export const HoldInsufficientFund: Story = {
  args: {
    livingMargin: {
      totalAssets: 1_200_000,
      avgDailyExpense: 8_000,
      monthlyIncome: 300_000,
      recordedDays: 30,
    },
  },
}

/** 備えは十分だが月次赤字 → 「今月は投資を控える月」 */
export const HoldMonthlyDeficit: Story = {
  args: {
    livingMargin: {
      totalAssets: 2_880_000,
      avgDailyExpense: 8_000,
      monthlyIncome: 200_000,
      recordedDays: 30,
    },
  },
}

/** 算出不能（総資産未設定）→ 何も描画しない */
export const HiddenNoAssets: Story = {
  args: {
    livingMargin: {
      totalAssets: null,
      avgDailyExpense: 8_000,
      monthlyIncome: 300_000,
      recordedDays: 30,
    },
  },
}
