import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { RecentExpenseList } from '../../components/dashboard/RecentExpenseList'
import type { ExpenseResponse, CategoryItem } from '../../lib/api/types'

const mockCategories: CategoryItem[] = [
  { id: 1, key: 'food', name: '食費', color: '#f18840', bg: '#fef5ee', balanceType: 0, displayOrder: 1 },
  { id: 17, key: 'salary', name: '給料', color: '#2dd4bf', bg: '#f0fdfa', balanceType: 1, displayOrder: 1 },
]

function makeExpense(overrides: Partial<ExpenseResponse> & { id: string }): ExpenseResponse {
  return {
    amount: 1000,
    balanceType: 0,
    userId: 'user1',
    categoryId: 1,
    content: null,
    date: '2024-03-15',
    createdDate: '2024-03-15T00:00:00.000Z',
    updatedDate: '2024-03-15T00:00:00.000Z',
    deletedDate: null,
    ...overrides,
  }
}

describe('RecentExpenseList', () => {
  it('記録がないとき「まだ記録がありません」を表示する', () => {
    render(<RecentExpenseList expenses={[]} allCategories={mockCategories} />)
    expect(screen.getByText('まだ記録がありません')).toBeInTheDocument()
  })

  it('記録があるとき、最大5件のみ表示する', () => {
    const expenses = Array.from({ length: 8 }, (_, i) =>
      makeExpense({ id: `id-${i}`, date: `2024-03-${String(15 - i).padStart(2, '0')}`, amount: 1000 + i })
    )
    render(<RecentExpenseList expenses={expenses} allCategories={mockCategories} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(5)
  })

  it('日付の新しい順（降順）に並べる', () => {
    const expenses = [
      makeExpense({ id: 'id-1', date: '2024-03-10', amount: 1000 }),
      makeExpense({ id: 'id-2', date: '2024-03-15', amount: 2000 }),
      makeExpense({ id: 'id-3', date: '2024-03-12', amount: 3000 }),
    ]
    render(<RecentExpenseList expenses={expenses} allCategories={mockCategories} />)
    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText('2024-03-15 · 食費')).toBeInTheDocument()
    expect(within(items[1]).getByText('2024-03-12 · 食費')).toBeInTheDocument()
    expect(within(items[2]).getByText('2024-03-10 · 食費')).toBeInTheDocument()
  })

  it('支出はマイナス（赤）表示する', () => {
    const expenses = [makeExpense({ id: 'id-1', balanceType: 0, amount: 3000 })]
    render(<RecentExpenseList expenses={expenses} allCategories={mockCategories} />)
    expect(screen.getByText('-¥3,000')).toBeInTheDocument()
  })

  it('収入はプラス（緑）表示する', () => {
    const expenses = [makeExpense({ id: 'id-1', balanceType: 1, amount: 200000, categoryId: 17 })]
    render(<RecentExpenseList expenses={expenses} allCategories={mockCategories} />)
    expect(screen.getByText('+¥200,000')).toBeInTheDocument()
  })

  it('content がある場合はカテゴリ名より優先して表示する', () => {
    const expenses = [makeExpense({ id: 'id-1', content: 'スーパーで買い物', categoryId: 1 })]
    render(<RecentExpenseList expenses={expenses} allCategories={mockCategories} />)
    expect(screen.getByText('スーパーで買い物')).toBeInTheDocument()
  })

  it('content が null のとき、カテゴリ名を表示する', () => {
    const expenses = [makeExpense({ id: 'id-1', content: null, categoryId: 1 })]
    render(<RecentExpenseList expenses={expenses} allCategories={mockCategories} />)
    // categoryId=1 の支出カテゴリは「食費」
    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getAllByText('食費').length).toBeGreaterThanOrEqual(1)
  })
})
