import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { WeeklyStreak } from './WeeklyStreak'
import { fixtureWeeklyRecord, fixtureWeeklyRecordMixed } from '@/__fixtures__/dashboard'

/**
 * ホームの「今週の記録」。直近7日の各日を
 * 節約達成 / 予算超過 / 記録なし / 未来日 の4状態アイコンで表示し、
 * タップでその日の支出内訳ツールチップを開く。
 */
const meta: Meta<typeof WeeklyStreak> = {
  title: 'Dashboard/WeeklyStreak',
  component: WeeklyStreak,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof WeeklyStreak>

/** 達成・超過・未記録が混在する標準的な1週間 */
export const Mixed: Story = {
  args: {
    weeklyRecord: fixtureWeeklyRecordMixed,
    dailyBudget: 2400,
  },
}

/** 全日で節約達成 */
export const AllAchieved: Story = {
  args: {
    weeklyRecord: fixtureWeeklyRecord([
      'achieved', 'achieved', 'achieved', 'achieved', 'achieved', 'achieved', 'achieved',
    ]),
    dailyBudget: 2400,
  },
}

/** 記録忘れが多い週（未入力日の可視化） */
export const MostlyUnrecorded: Story = {
  args: {
    weeklyRecord: fixtureWeeklyRecord([
      'unrecorded', 'unrecorded', 'achieved', 'unrecorded', 'unrecorded', 'over', 'unrecorded',
    ]),
    dailyBudget: 2400,
  },
}

/** 1日予算が未設定（null）: 支出があるだけで超過扱いになる境界ケース */
export const NoBudget: Story = {
  args: {
    weeklyRecord: fixtureWeeklyRecordMixed,
    dailyBudget: null,
  },
}
