import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { ExpenseCreateForm } from '../../components/expense/ExpenseCreateForm'
import type { CategoryItem } from '@/lib/api/types'

const routerRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: routerRefresh }),
}));


// Server Actionをモック
vi.mock('@/lib/actions/expense', () => ({
    createExpenseAction: vi.fn(),
}))

// ESM環境ではvi.spyOnは不可。vi.mockでuseActionStateをモックする
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>()
    return {
        ...actual,
        useActionState: vi.fn(),
    }
})

const mockExpenseCategories: CategoryItem[] = [
    { id: 1, key: 'food', name: '食費', color: '#f18840', bg: '#fef5ee', balanceType: 0, displayOrder: 1 },
    { id: 2, key: 'daily', name: '日用品', color: '#a78bfa', bg: '#f5f3ff', balanceType: 0, displayOrder: 2 },
]

const mockIncomeCategories: CategoryItem[] = [
    { id: 17, key: 'salary', name: '給料', color: '#2dd4bf', bg: '#f0fdfa', balanceType: 1, displayOrder: 1 },
]

const defaultCategoryProps = {
    expenseCategories: mockExpenseCategories,
    incomeCategories: mockIncomeCategories,
}

describe('ExpenseCreateForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('初期表示: フォームが描画される', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: false },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseCreateForm userId="user-1" {...defaultCategoryProps} />)

        expect(screen.getByLabelText('金額（円）')).toBeInTheDocument()
        expect(screen.getByLabelText('日付')).toBeInTheDocument()
        expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '追加する' })).toBeInTheDocument()
    })

    it('fieldErrors.amount があるとき、エラーメッセージを表示する', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: false, fieldErrors: { amount: ['金額は1以上の値を入力してください'] } },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseCreateForm userId="user-1" {...defaultCategoryProps} />)

        expect(screen.getByText('金額は1以上の値を入力してください')).toBeInTheDocument()
    })

    it('state.error があるとき、エラーメッセージを表示する', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: 'サーバーエラーが発生しました', success: false },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseCreateForm userId="user-1" {...defaultCategoryProps} />)

        expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument()
    })

    it('state.success=true のとき、成功メッセージを表示する', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: true },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseCreateForm userId="user-1" {...defaultCategoryProps} />)

        expect(screen.getByText('登録しました')).toBeInTheDocument()
    })

    it('defaultDate が渡されたとき、日付入力に反映される', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: false },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseCreateForm userId="user-1" defaultDate="2026-04-13" {...defaultCategoryProps} />)

        const dateInput = screen.getByLabelText('日付') as HTMLInputElement
        expect(dateInput.defaultValue).toBe('2026-04-13')
    })

    it('isPending=true のとき、ボタンが disabled になる', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: false },
            vi.fn(),
            true,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseCreateForm userId="user-1" {...defaultCategoryProps} />)

        const button = screen.getByRole('button', { name: '登録中...' })
        expect(button).toBeDisabled()
    })

    it('初期表示: 最初の支出カテゴリ（id=1）が選択されている', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: false },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseCreateForm userId="user-1" {...defaultCategoryProps} />)

        const select = screen.getByLabelText('カテゴリ') as HTMLSelectElement
        expect(select.value).toBe('1')
    })

    it('defaultBalanceType=1 のとき: 収入タブが初期選択される', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: false },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseCreateForm userId="user-1" defaultBalanceType={1} {...defaultCategoryProps} />)

        // 収入タブがアクティブ（style で判定）
        const incomeButton = screen.getByRole('button', { name: '収入' })
        expect(incomeButton).toHaveStyle({ color: '#fff' })
        // 支出タブは非アクティブ
        const expenseButton = screen.getByRole('button', { name: '支出' })
        expect(expenseButton).not.toHaveStyle({ color: '#fff' })
    })

    it('支出→収入に切り替えたとき: カテゴリが最初の収入カテゴリにリセットされる', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: false },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseCreateForm userId="user-1" {...defaultCategoryProps} />)

        // カテゴリを日用品（id=2）に変更
        const select = screen.getByLabelText('カテゴリ') as HTMLSelectElement
        fireEvent.change(select, { target: { value: '2' } })
        expect(select.value).toBe('2')

        // 収入タブに切り替え
        fireEvent.click(screen.getByRole('button', { name: '収入' }))

        // カテゴリが最初の収入カテゴリ（id=17）にリセットされる
        expect(select.value).toBe('17')
    })
})
