import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { DailyBudgetHero } from './DailyBudgetHero'
import { fixtureDailyBudget } from '@/__fixtures__/dashboard'

/**
 * ホーム最上部の「今日使えるお金」ヒーロー。
 * 残額比率に応じて safe（余裕）/ caution（注意）/ danger（ピンチ）の
 * 3トーンでカラーとバッジが切り替わる。
 */
const meta: Meta<typeof DailyBudgetHero> = {
  title: 'Dashboard/DailyBudgetHero',
  component: DailyBudgetHero,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DailyBudgetHero>

/** 残額 80% 以上: 「余裕」バッジ（グリーン系トーン） */
export const Safe: Story = {
  args: {
    dailyBudget: fixtureDailyBudget('safe'),
    todayExpense: 360,
  },
}

/** 残額 20〜80%: 「注意」バッジ（アンバー系トーン） */
export const Caution: Story = {
  args: {
    dailyBudget: fixtureDailyBudget('caution'),
    todayExpense: 1320,
  },
}

/** 残額 20% 未満: 「ピンチ」バッジ（レッド系トーン） */
export const Danger: Story = {
  args: {
    dailyBudget: fixtureDailyBudget('danger'),
    todayExpense: 2160,
  },
}

/** 初回設定が未完了（dailyBudget が null）のときの案内表示 */
export const SetupIncomplete: Story = {
  args: {
    dailyBudget: null,
    todayExpense: 0,
  },
}
