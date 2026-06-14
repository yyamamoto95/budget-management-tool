import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from './Button'

const meta: Meta = {
  title: 'Common/Drawer',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Basic: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>ドロワーを開く</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>クイック記録</DrawerTitle>
          <DrawerDescription>今日の支出をすばやく記録します。</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-[#1c1410]">金額</span>
            <input
              type="number"
              placeholder="0"
              className="rounded-xl border border-[rgba(28,20,16,0.08)] px-4 py-2.5 text-sm focus:border-[#f18840] focus:outline-none focus:bg-[#fff6ee]"
            />
          </label>
        </div>
        <DrawerFooter>
          <Button fullWidth>記録する</Button>
          <DrawerClose asChild>
            <Button variant="secondary" fullWidth>キャンセル</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}
