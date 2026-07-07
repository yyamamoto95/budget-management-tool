import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { EmptyState } from './EmptyState'

/**
 * 初回設定完了直後のホーム空状態。
 * 計算された1日予算をトーン付きで見せ、最初の支出記録へ誘導する。
 */
const meta: Meta<typeof EmptyState> = {
  title: 'Dashboard/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { onQuickEntry: fn() },
}

export default meta
type Story = StoryObj<typeof EmptyState>

/** 余裕トーンの1日予算 */
export const Safe: Story = {
  args: {
    dailyBudget: 2400,
    daysUntilPayday: 18,
    tone: 'safe',
  },
}

/** 注意トーン（予算が少なめに計算されたケース） */
export const Caution: Story = {
  args: {
    dailyBudget: 900,
    daysUntilPayday: 25,
    tone: 'caution',
  },
}

/** ピンチトーン（固定費が重く1日予算がほぼ残らないケース） */
export const Danger: Story = {
  args: {
    dailyBudget: 300,
    daysUntilPayday: 28,
    tone: 'danger',
  },
}
