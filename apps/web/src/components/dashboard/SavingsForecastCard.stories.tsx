import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SavingsForecastCard } from './SavingsForecastCard'

/**
 * ホームの「今月の貯蓄予測」（サンドボックス Block 3 準拠 / #458）。
 * 今日のペースで残り日数を延長した月末予測残高を、貯蓄達成率に応じた
 * 4状態（超好調/好調/注意/危険）のトーンで表示する。
 * 基準日を固定（2026-07-15）し、今日の支出0とすることで表示を決定論化している。
 */
const meta: Meta<typeof SavingsForecastCard> = {
  title: 'Dashboard/SavingsForecastCard',
  component: SavingsForecastCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    today: new Date('2026-07-15T00:00:00'),
  },
}

export default meta
type Story = StoryObj<typeof SavingsForecastCard>

/** 超好調（達成率 ≥ 150%）: ブランドオレンジ */
export const Excellent: Story = {
  args: {
    monthSummary: { expense: 50_000, income: 300_000 },
    todayExpense: 0,
    savingsGoal: 30_000,
  },
}

/** 好調（100〜149%）: グリーン */
export const Safe: Story = {
  args: {
    monthSummary: { expense: 260_000, income: 300_000 },
    todayExpense: 0,
    savingsGoal: 30_000,
  },
}

/** 注意（50〜99%）: ピンク */
export const Caution: Story = {
  args: {
    monthSummary: { expense: 280_000, income: 300_000 },
    todayExpense: 0,
    savingsGoal: 30_000,
  },
}

/** 危険（赤字見込み）: レッド */
export const Danger: Story = {
  args: {
    monthSummary: { expense: 350_000, income: 300_000 },
    todayExpense: 0,
    savingsGoal: 30_000,
  },
}

/** 貯蓄目標が未設定（0）のときの表示 */
export const NoGoal: Story = {
  args: {
    monthSummary: { expense: 120_000, income: 300_000 },
    todayExpense: 0,
    savingsGoal: 0,
  },
}
