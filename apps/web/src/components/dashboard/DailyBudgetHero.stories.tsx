import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { DailyBudgetHero } from './DailyBudgetHero'
import { fixtureDailyBudget } from '@/__fixtures__/dashboard'

/**
 * ホーム最上部の「今日使えるお金」ヒーロー（#459 で「今日の状況」相当へ強化）。
 * - カード背景: 残額比率による3トーン（safe/caution/danger）
 * - バッジ・進捗バー: 日予算消化率による4状態（好調 ≤50% / 順調 ≤80% / 注意 ≤100% / 超過）
 * - 貯蓄インサイト: 月末予測（calcSavingsForecast）による1行メッセージ
 * 基準日を固定（2026-07-15）して表示を決定論化している。
 */
const meta: Meta<typeof DailyBudgetHero> = {
  title: 'Dashboard/DailyBudgetHero',
  component: DailyBudgetHero,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    monthSummary: { expense: 120_000, income: 300_000 },
    savingsGoal: 30_000,
    today: new Date('2026-07-15T00:00:00'),
  },
}

export default meta
type Story = StoryObj<typeof DailyBudgetHero>

/** 好調（消化率 ≤ 50%・緑）+ 目標大幅達成見込みのインサイト */
export const Great: Story = {
  args: {
    dailyBudget: fixtureDailyBudget('safe'),
    todayExpense: 360,
  },
}

/** 順調（消化率 51〜80%・緑） */
export const Steady: Story = {
  args: {
    dailyBudget: fixtureDailyBudget('caution'),
    todayExpense: 1_680,
  },
}

/** 注意（消化率 81〜100%・ピンク） */
export const Caution: Story = {
  args: {
    dailyBudget: fixtureDailyBudget('caution'),
    todayExpense: 2_160,
  },
}

/** 超過（消化率 > 100%・赤）+ 赤字見込みインサイト */
export const Over: Story = {
  args: {
    dailyBudget: fixtureDailyBudget('danger'),
    todayExpense: 3_000,
    monthSummary: { expense: 290_000, income: 300_000 },
  },
}

/** 貯蓄目標未設定: インサイトが消化率ベースの文言に縮退する */
export const NoGoal: Story = {
  args: {
    dailyBudget: fixtureDailyBudget('safe'),
    todayExpense: 360,
    savingsGoal: 0,
  },
}

/** 初回設定が未完了（dailyBudget が null）のときの案内表示 */
export const SetupIncomplete: Story = {
  args: {
    dailyBudget: null,
    todayExpense: 0,
  },
}
