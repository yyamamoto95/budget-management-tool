import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { QuickEntryDrawer } from './QuickEntryDrawer'
import {
  fixtureExpenseCategories,
  fixtureIncomeCategories,
} from '@/__fixtures__/dashboard'

/**
 * モバイルの FAB から開くクイック記録ドロワー。
 * テンキー・カテゴリ選択・メモ入力を1画面で完結させる。
 * 収支タブ切替・送信フィードバックは内部 state のため、
 * インタラクション検証は play function（#468）で扱う。
 */
const meta: Meta<typeof QuickEntryDrawer> = {
  title: 'Expense/QuickEntryDrawer',
  component: QuickEntryDrawer,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  args: {
    userId: 'storybook-user',
    open: true,
    onOpenChange: fn(),
  },
}

export default meta
type Story = StoryObj<typeof QuickEntryDrawer>

/** 支出モードで開いた状態（デフォルト） */
export const Open: Story = {
  args: {
    expenseCategories: fixtureExpenseCategories,
    incomeCategories: fixtureIncomeCategories,
  },
}

/** カテゴリが4件以下（「もっと見る」なし） */
export const FewCategories: Story = {
  args: {
    expenseCategories: fixtureExpenseCategories.slice(0, 3),
    incomeCategories: fixtureIncomeCategories,
  },
}
