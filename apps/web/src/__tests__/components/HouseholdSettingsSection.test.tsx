import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HouseholdSettingsSection } from '../../components/settings/HouseholdSettingsSection'

vi.mock('@/lib/actions/settings', () => ({
    upsertSettingsAction: vi.fn().mockResolvedValue({ error: null, success: true }),
}))

import { upsertSettingsAction } from '../../lib/actions/settings'

const defaultProps = {
    paydayDay: 25,
    monthlyIncome: 300000,
    fixedExpenses: 80000,
    totalAssets: 1000000,
}

describe('HouseholdSettingsSection', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(upsertSettingsAction).mockResolvedValue({ error: null, success: true })
    })

    it('見出し「家計基本設定」が表示されること', () => {
        render(<HouseholdSettingsSection {...defaultProps} />)

        expect(screen.getByRole('heading', { name: '家計基本設定' })).toBeInTheDocument()
    })

    it('初期値として渡したpaydayDayが給料日フィールドに表示されること', () => {
        render(<HouseholdSettingsSection {...defaultProps} />)

        const input = screen.getByRole('spinbutton', { name: '給料日' })
        expect(input).toHaveValue(25)
    })

    it('初期値として渡したmonthlyIncomeが月収フィールドに表示されること', () => {
        render(<HouseholdSettingsSection {...defaultProps} />)

        const input = screen.getByRole('spinbutton', { name: '月収' })
        expect(input).toHaveValue(300000)
    })

    it('初期値として渡したfixedExpensesが固定費フィールドに表示されること', () => {
        render(<HouseholdSettingsSection {...defaultProps} />)

        const input = screen.getByRole('spinbutton', { name: '固定費' })
        expect(input).toHaveValue(80000)
    })

    it('初期値として渡したtotalAssetsが現在の総資産フィールドに表示されること', () => {
        render(<HouseholdSettingsSection {...defaultProps} />)

        const input = screen.getByRole('spinbutton', { name: '現在の総資産' })
        expect(input).toHaveValue(1000000)
    })

    it('保存ボタンが存在すること', () => {
        render(<HouseholdSettingsSection {...defaultProps} />)

        expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
    })

    it('保存ボタン押下: upsertSettingsAction が呼ばれること', async () => {
        render(<HouseholdSettingsSection {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '保存' }))

        await waitFor(() => {
            expect(upsertSettingsAction).toHaveBeenCalled()
        })
    })

    it('保存成功後: 「保存しました」メッセージが表示されること', async () => {
        render(<HouseholdSettingsSection {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '保存' }))

        await waitFor(() => {
            expect(screen.getByRole('status')).toHaveTextContent('保存しました')
        })
    })

    it('エラー時: エラーメッセージが表示されること', async () => {
        vi.mocked(upsertSettingsAction).mockResolvedValue({ error: '保存に失敗しました', success: false })

        render(<HouseholdSettingsSection {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: '保存' }))

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('保存に失敗しました')
        })
    })
})
