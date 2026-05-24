import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { ExpenseEditModal } from '../../components/expense/ExpenseEditModal'
import type { ExpenseResponse, CategoryItem } from '@/lib/api/types'

// Server Action をモック
vi.mock('@/lib/actions/expense', () => ({
    updateExpenseAction: vi.fn(),
}))

// useActionState をモック
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>()
    return {
        ...actual,
        useActionState: vi.fn(),
    }
})

const mockExpenseCategories: CategoryItem[] = [
    { id: 1, key: 'food', name: '食費', color: '#f18840', bg: '#fef5ee', balanceType: 0, displayOrder: 1 },
]

const mockIncomeCategories: CategoryItem[] = [
    { id: 1, key: 'salary', name: '給料', color: '#2dd4bf', bg: '#f0fdfa', balanceType: 1, displayOrder: 1 },
]

const mockExpense: ExpenseResponse = {
    id: 'expense-001',
    amount: 1500,
    balanceType: 0,
    userId: 'user-001',
    categoryId: 1,
    content: '昼食代',
    date: '2026-05-01',
    createdDate: '2026-05-01T12:00:00.000Z',
    updatedDate: '2026-05-01T12:00:00.000Z',
    deletedDate: null,
}

describe('ExpenseEditModal', () => {
    const defaultProps = {
        expense: mockExpense,
        onClose: vi.fn(),
        expenseCategories: mockExpenseCategories,
        incomeCategories: mockIncomeCategories,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: false },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)
    })

    it('初期表示: 既存の balanceType（支出）が表示されている', () => {
        render(<ExpenseEditModal {...defaultProps} />)

        // Radix Select は hidden input に value をセット
        const balanceTypeInput = document.querySelector('input[name="balanceType"]') as HTMLInputElement
        expect(balanceTypeInput.value).toBe('0')
    })

    it('初期表示: 既存の categoryId が hidden input に反映されている', () => {
        render(<ExpenseEditModal {...defaultProps} />)

        const categoryInput = document.querySelector('input[name="categoryId"]') as HTMLInputElement
        expect(categoryInput.value).toBe('1')
    })

    it('初期表示: 収入データを開いたとき、収入のカテゴリが選択されている', () => {
        render(<ExpenseEditModal {...defaultProps} expense={{ ...mockExpense, balanceType: 1, categoryId: 1 }} />)

        // 収入カテゴリ「給料」が SelectValue として表示される（Radix は hidden native option も出力するため getAllByText を使用）
        expect(screen.queryAllByText('給料').length).toBeGreaterThan(0)
        // 支出専用カテゴリ「食費」は表示されない
        expect(screen.queryAllByText('食費').length).toBe(0)
    })

    it('state.error があるとき、エラーメッセージを表示する', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: '支出の更新に失敗しました', success: false },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseEditModal {...defaultProps} />)

        expect(screen.getByText('支出の更新に失敗しました')).toBeInTheDocument()
    })

    it('isPending=true のとき、ボタンが disabled になる', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, success: false },
            vi.fn(),
            true,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<ExpenseEditModal {...defaultProps} />)

        expect(screen.getByRole('button', { name: '更新中...' })).toBeDisabled()
    })

    it('閉じるボタン押下: onClose が呼ばれる', () => {
        render(<ExpenseEditModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '閉じる' }))

        expect(defaultProps.onClose).toHaveBeenCalledOnce()
    })
})
