import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AmountField } from '@/components/common/AmountField'

/** 入力挙動を検証するための制御付きラッパー */
function Controlled({ initial = 0, ...rest }: { initial?: number } & Partial<React.ComponentProps<typeof AmountField>>) {
    const [value, setValue] = useState(initial)
    return (
        <>
            <AmountField value={value} onChange={setValue} label="金額" {...rest} />
            <output data-testid="value">{value}</output>
        </>
    )
}

describe('AmountField', () => {
    it('値が桁区切りで表示される', () => {
        render(<AmountField value={250000} onChange={vi.fn()} label="金額" />)
        expect(screen.getByRole('textbox', { name: '金額' })).toHaveValue('250,000')
    })

    it('− / + ステッパーで step 分だけ増減する', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<AmountField value={5000} onChange={onChange} step={1000} label="金額" />)

        await user.click(screen.getByRole('button', { name: '1,000円増やす' }))
        expect(onChange).toHaveBeenLastCalledWith(6000)

        await user.click(screen.getByRole('button', { name: '1,000円減らす' }))
        expect(onChange).toHaveBeenLastCalledWith(4000)
    })

    it('下限(0)で − ボタンが非活性になる', () => {
        render(<AmountField value={0} onChange={vi.fn()} label="金額" />)
        expect(screen.getByRole('button', { name: '1,000円減らす' })).toBeDisabled()
        expect(screen.getByRole('button', { name: '1,000円増やす' })).not.toBeDisabled()
    })

    it('上限で + ボタンが非活性になる', () => {
        render(<AmountField value={31} onChange={vi.fn()} step={1} max={31} label="金額" />)
        expect(screen.getByRole('button', { name: '1円増やす' })).toBeDisabled()
    })

    it('¥0 のフィールドに数字を打つと先頭ゼロにならず数値が反映される', async () => {
        const user = userEvent.setup()
        render(<Controlled initial={0} />)

        const input = screen.getByRole('textbox', { name: '金額' })
        await user.click(input)
        await user.type(input, '5000')

        expect(input).toHaveValue('5,000')
        expect(screen.getByTestId('value')).toHaveTextContent('5000')
    })

    it('マイナス記号は入力できない', async () => {
        const user = userEvent.setup()
        render(<Controlled initial={0} />)

        const input = screen.getByRole('textbox', { name: '金額' })
        await user.click(input)
        await user.type(input, '-100')

        expect(input).toHaveValue('100')
        expect(screen.getByTestId('value')).toHaveTextContent('100')
    })

    it('上限を超える値は入力段階でブロックされる', async () => {
        const user = userEvent.setup()
        render(<Controlled initial={0} max={31} thousandSeparator={false} />)

        const input = screen.getByRole('textbox', { name: '金額' })
        await user.click(input)
        await user.type(input, '99')

        // 31 を超える入力は弾かれ、最初の桁(9)のみ反映される
        expect(screen.getByTestId('value')).toHaveTextContent('9')
    })
})
