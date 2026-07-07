import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LivingMarginCard } from './LivingMarginCard'

/**
 * ホームの「生活余力」カード（US-402 / core-spec.md ①②）。
 * 「今の資産で生活費あと何ヶ月分か」を数字主役・事実のみのトーンで表示し、
 * 算出不能の場合は理由と次のアクションを案内する。
 * 余力の計算は @budget/common の calculateLivingMargin に委譲している。
 */
const meta: Meta<typeof LivingMarginCard> = {
  title: 'Dashboard/LivingMarginCard',
  component: LivingMarginCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof LivingMarginCard>

/** 収入が支出を上回り、余力が増加中（グリーンのトレンド表示） */
export const Increasing: Story = {
  args: {
    livingMargin: {
      totalAssets: 960_000,
      avgDailyExpense: 8_000,
      monthlyIncome: 300_000,
      recordedDays: 30,
    },
  },
}

/** 支出超過で余力が毎月減少している（注意トーンのトレンド表示） */
export const Decreasing: Story = {
  args: {
    livingMargin: {
      totalAssets: 960_000,
      avgDailyExpense: 8_000,
      monthlyIncome: 100_000,
      recordedDays: 30,
    },
  },
}

/** 減少幅が丸めて 0.0 になる境界: 「余力はほぼ横ばい」表示 */
export const AlmostFlat: Story = {
  args: {
    livingMargin: {
      totalAssets: 960_000,
      avgDailyExpense: 8_000,
      monthlyIncome: 239_000,
      recordedDays: 30,
    },
  },
}

/** 総資産が未設定: 設定画面への導線を表示する */
export const NoAssets: Story = {
  args: {
    livingMargin: {
      totalAssets: null,
      avgDailyExpense: 8_000,
      monthlyIncome: 250_000,
      recordedDays: 30,
    },
  },
}

/** 支出記録がまだない: 最初の記録を促す案内 */
export const NoExpenseData: Story = {
  args: {
    livingMargin: {
      totalAssets: 960_000,
      avgDailyExpense: 0,
      monthlyIncome: 250_000,
      recordedDays: 0,
    },
  },
}

/** 記録日数が7日未満: 記録が溜まると表示される旨の案内 */
export const InsufficientData: Story = {
  args: {
    livingMargin: {
      totalAssets: 960_000,
      avgDailyExpense: 8_000,
      monthlyIncome: 250_000,
      recordedDays: 3,
    },
  },
}
