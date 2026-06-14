import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LoadingSpinner } from './LoadingSpinner'

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Common/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
}

export default meta

type Story = StoryObj<typeof LoadingSpinner>

/** デフォルト（md） */
export const Default: Story = {}

/** サイズ比較 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <LoadingSpinner size="sm" />
      <LoadingSpinner size="md" />
      <LoadingSpinner size="lg" />
    </div>
  ),
}

/** ボタン内埋め込みパターン */
export const InsideButton: Story = {
  render: () => (
    <button
      disabled
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-[#f18840] border border-[rgba(28,20,16,0.08)] opacity-50 cursor-not-allowed"
    >
      <LoadingSpinner size="sm" />
      <span>処理中...</span>
    </button>
  ),
}

/** フルスクリーンオーバーレイパターン */
export const Overlay: Story = {
  render: () => (
    <div className="relative w-64 h-32 rounded-xl bg-white border border-[#1c1410]/20 overflow-hidden">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-[#1c1410]/60">読み込み中...</p>
      </div>
    </div>
  ),
}
