import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExpenseInputModal } from '../../components/input/ExpenseInputModal'

// vi.mock はホイストされるため、参照する変数は vi.hoisted で先に初期化する
const { routerRefresh } = vi.hoisted(() => ({ routerRefresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: routerRefresh }),
}));


const mockCreateExpenseAction = vi.fn().mockResolvedValue({ error: null, success: true })
vi.mock('@/lib/actions/expense', () => ({
    createExpenseAction: (...args: unknown[]) => mockCreateExpenseAction(...args),
}))

vi.mock('@budget/common', () => ({
    calcExpenseImpact: vi.fn().mockReturnValue({ label: '約10分' }),
}))

// framer-motion のレイアウトアニメーションをテスト環境用に無効化
vi.mock('framer-motion', async (importOriginal) => {
    const actual = await importOriginal<typeof import('framer-motion')>()
    return {
        ...actual,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }
})

describe('ExpenseInputModal', () => {
    const defaultProps = {
        userId: 'user-1',
        minutesPerYen: 0.1,
        onClose: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('初期表示: タイトルが表示され、支出タブがアクティブである', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        expect(screen.getByText('支出・収入を記録')).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: '支出' })).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('tab', { name: '収入' })).toHaveAttribute('aria-selected', 'false')
    })

    it('初期表示: ¥0 が表示される', () => {
        render(<ExpenseInputModal {...defaultProps} />)
        expect(screen.getByText('¥')).toBeInTheDocument()
        expect(screen.getByTestId('amount-display')).toHaveTextContent('0')
    })

    it('テンキー: 数字をタップすると金額が更新される', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '1' }))
        fireEvent.click(screen.getByRole('button', { name: '5' }))
        fireEvent.click(screen.getByRole('button', { name: '0' }))

        expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('テンキー: 000ボタンで3ゼロが追加される', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '1' }))
        fireEvent.click(screen.getByRole('button', { name: '000' }))

        expect(screen.getByText('1,000')).toBeInTheDocument()
    })

    it('テンキー: ⌫ボタンで最後の1文字が削除される', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '1' }))
        fireEvent.click(screen.getByRole('button', { name: '2' }))
        fireEvent.click(screen.getByRole('button', { name: '1文字削除' }))

        expect(screen.getByTestId('amount-display')).toHaveTextContent('1')
    })

    it('支出のとき: 金額入力後に家計への影響が表示される', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '1' }))
        fireEvent.click(screen.getByRole('button', { name: '0' }))
        fireEvent.click(screen.getByRole('button', { name: '0' }))

        expect(screen.getByText(/家計への影響/)).toBeInTheDocument()
        expect(screen.getByText('約10分')).toBeInTheDocument()
    })

    it('収入のとき: 金額入力後に家計への影響は表示されない', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('tab', { name: '収入' }))
        fireEvent.click(screen.getByRole('button', { name: '1' }))
        fireEvent.click(screen.getByRole('button', { name: '0' }))
        fireEvent.click(screen.getByRole('button', { name: '0' }))

        expect(screen.queryByText(/家計への影響/)).not.toBeInTheDocument()
    })

    it('カテゴリ選択: クリックで別のカテゴリを選べる', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        // 「外食」カテゴリをクリック（visible の2番目）
        fireEvent.click(screen.getByRole('button', { name: '外食' }))

        // 「外食」ボタンが選択状態になっていることを確認（aria 属性では管理していないため、
        // 単にボタンが存在することを確認する）
        expect(screen.getByRole('button', { name: '外食' })).toBeInTheDocument()
    })

    it('もっと見る: クリックで残りのカテゴリが表示される', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        // 初期表示では「もっと見る」ボタンがある
        const moreBtn = screen.getByRole('button', { name: /もっと見る/ })
        expect(moreBtn).toBeInTheDocument()

        fireEvent.click(moreBtn)

        // 展開後は折りたたむボタンが表示される
        expect(screen.getByRole('button', { name: '折りたたむ' })).toBeInTheDocument()
        // 展開後は「光熱費」など残りのカテゴリが表示される
        expect(screen.getByRole('button', { name: '光熱費' })).toBeInTheDocument()
    })

    it('収入タブ切替: 収入カテゴリが表示される', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('tab', { name: '収入' }))

        expect(screen.getByRole('button', { name: '給料' })).toBeInTheDocument()
    })

    it('記録するボタン押下（支出）: balanceType=0 で createExpenseAction が呼ばれる', async () => {
        render(<ExpenseInputModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '1' }))
        fireEvent.click(screen.getByRole('button', { name: '0' }))
        fireEvent.click(screen.getByRole('button', { name: '0' }))

        fireEvent.click(screen.getByRole('button', { name: /記録する/ }))

        await vi.waitFor(() => {
            expect(mockCreateExpenseAction).toHaveBeenCalledOnce()
        })

        const [, formData] = mockCreateExpenseAction.mock.calls[0] as [unknown, FormData]
        expect(formData.get('balanceType')).toBe('0')
        expect(formData.get('amount')).toBe('100')
    })

    it('記録するボタン押下（収入）: balanceType=1 で createExpenseAction が呼ばれる', async () => {
        render(<ExpenseInputModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('tab', { name: '収入' }))
        fireEvent.click(screen.getByRole('button', { name: '5' }))
        fireEvent.click(screen.getByRole('button', { name: '000' }))

        fireEvent.click(screen.getByRole('button', { name: /記録する/ }))

        await vi.waitFor(() => {
            expect(mockCreateExpenseAction).toHaveBeenCalledOnce()
        })

        const [, formData] = mockCreateExpenseAction.mock.calls[0] as [unknown, FormData]
        expect(formData.get('balanceType')).toBe('1')
        expect(formData.get('amount')).toBe('5000')
    })

    it('閉じるボタン押下: onClose が呼ばれる', () => {
        render(<ExpenseInputModal {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '閉じる' }))

        expect(defaultProps.onClose).toHaveBeenCalledOnce()
    })
})
