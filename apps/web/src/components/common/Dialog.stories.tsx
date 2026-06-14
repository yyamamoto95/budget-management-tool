import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from './Button'

const meta: Meta = {
  title: 'Common/Dialog',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Basic: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">ダイアログを開く</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>予算を削除しますか？</DialogTitle>
          <DialogDescription>この操作は取り消せません。削除したデータは復元できません。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">キャンセル</Button>
          </DialogClose>
          <Button variant="destructive">削除する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const Form: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>予算を設定する</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>月次予算の設定</DialogTitle>
          <DialogDescription>今月の目標予算を入力してください。</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-[#1c1410]">月次予算（円）</span>
            <input
              type="number"
              placeholder="例：150000"
              className="rounded-xl border border-[rgba(28,20,16,0.08)] px-4 py-2.5 text-sm focus:border-[#f18840] focus:outline-none focus:bg-[#fff6ee]"
            />
          </label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">キャンセル</Button>
          </DialogClose>
          <Button>保存する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
