import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InitialSetupWizard } from '../../components/setup/InitialSetupWizard'

vi.mock('@/lib/actions/settings', () => ({
    saveUserSettingsAction: vi.fn().mockResolvedValue(null),
}))

vi.mock('@budget/common', () => ({
    calcDailyBudget: vi.fn().mockReturnValue({
        dailyBudget: 3000,
        daysUntilPayday: 10,
        availableBalance: 30000,
    }),
}))

import { saveUserSettingsAction } from '../../lib/actions/settings'

describe('InitialSetupWizard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(saveUserSettingsAction).mockResolvedValue(null)
    })

    it('初期表示: ステップ1（給料日・月収）が表示されること', () => {
        render(<InitialSetupWizard />)

        expect(screen.getByText('給料日と月収を教えてください')).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: '給料日' })).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: '月収' })).toBeInTheDocument()
    })

    it('「次へ」ボタンを押すとステップ2（固定費）に進むこと', () => {
        render(<InitialSetupWizard />)

        fireEvent.click(screen.getByRole('button', { name: /次へ/ }))

        expect(screen.getByText('月の固定費を教えてください')).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: '固定費' })).toBeInTheDocument()
    })

    it('ステップ2 → ステップ3（現在残高）に進めること', () => {
        render(<InitialSetupWizard />)

        fireEvent.click(screen.getByRole('button', { name: /次へ/ }))
        fireEvent.click(screen.getByRole('button', { name: /次へ/ }))

        expect(screen.getByText('今の残高を教えてください')).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: '現在の残高' })).toBeInTheDocument()
    })

    it('ステップ3 → ステップ4（サマリー）に進めること', () => {
        render(<InitialSetupWizard />)

        fireEvent.click(screen.getByRole('button', { name: /次へ/ }))
        fireEvent.click(screen.getByRole('button', { name: /次へ/ }))
        fireEvent.click(screen.getByRole('button', { name: /計算する/ }))

        expect(screen.getByText('あなたの1日予算')).toBeInTheDocument()
    })

    it('サマリー画面で「はじめる」を押すと saveUserSettingsAction が呼ばれること', async () => {
        render(<InitialSetupWizard />)

        fireEvent.click(screen.getByRole('button', { name: /次へ/ }))
        fireEvent.click(screen.getByRole('button', { name: /次へ/ }))
        fireEvent.click(screen.getByRole('button', { name: /計算する/ }))

        const submitButton = screen.getByRole('button', { name: /はじめる/ })
        expect(submitButton).toBeInTheDocument()

        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(saveUserSettingsAction).toHaveBeenCalled()
        })
    })

    it('戻るボタン押下: 前のステップに戻ること', () => {
        render(<InitialSetupWizard />)

        fireEvent.click(screen.getByRole('button', { name: /次へ/ }))
        expect(screen.getByText('月の固定費を教えてください')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /^$/})) // 最初の戻るボタン（アイコンのみ）
        expect(screen.getByText('給料日と月収を教えてください')).toBeInTheDocument()
    })

    it('「あとで設定する」ボタンを押すと saveUserSettingsAction が呼ばれること', async () => {
        render(<InitialSetupWizard />)

        const skipButton = screen.getByRole('button', { name: /あとで設定する/ })
        fireEvent.click(skipButton)

        await waitFor(() => {
            expect(saveUserSettingsAction).toHaveBeenCalled()
        })
    })

    it('isPending=true のとき、ボタンが disabled になること', () => {
        render(<InitialSetupWizard />)

        const nextButton = screen.getByRole('button', { name: /次へ/ })
        expect(nextButton).not.toBeDisabled()
    })

})
