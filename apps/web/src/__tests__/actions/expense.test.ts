import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '../../lib/api/client'

vi.mock('../../lib/api/client', () => ({
    ApiError: class ApiError extends Error {
        constructor(public readonly status: number, message: string) {
            super(message)
            this.name = 'ApiError'
        }
    },
    serverFetch: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

import { createExpenseAction, updateExpenseAction } from '../../lib/actions/expense'
import { serverFetch } from '../../lib/api/client'

// ─── createExpenseAction ──────────────────────────────────────────

describe('createExpenseAction', () => {
    const initialState = { error: null, success: false }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('バリデーションエラー: amount が 0 のとき fieldErrors を返す', async () => {
        const formData = new FormData()
        formData.set('amount', '0')
        formData.set('balanceType', '0')
        formData.set('userId', 'user1')
        formData.set('date', '2024-01-01')

        const result = await createExpenseAction(initialState, formData)

        expect(result.fieldErrors?.amount).toBeDefined()
        expect(serverFetch).not.toHaveBeenCalled()
    })

    it('バリデーションエラー: date が空のとき fieldErrors を返す', async () => {
        const formData = new FormData()
        formData.set('amount', '1000')
        formData.set('balanceType', '0')
        formData.set('userId', 'user1')
        formData.set('date', '')

        const result = await createExpenseAction(initialState, formData)

        expect(result.fieldErrors?.date).toBeDefined()
        expect(serverFetch).not.toHaveBeenCalled()
    })

    it('正常系: 有効なデータで支出を登録し success を返す', async () => {
        vi.mocked(serverFetch).mockResolvedValue({})

        const formData = new FormData()
        formData.set('amount', '1000')
        formData.set('balanceType', '0')
        formData.set('userId', 'user1')
        formData.set('date', '2024-01-01')

        const result = await createExpenseAction(initialState, formData)

        expect(result.success).toBe(true)
        expect(result.error).toBeNull()
    })

    it('API が 403 を返すとき認証エラーメッセージを返す', async () => {
        vi.mocked(serverFetch).mockRejectedValue(new ApiError(403, 'Forbidden'))

        const formData = new FormData()
        formData.set('amount', '1000')
        formData.set('balanceType', '0')
        formData.set('userId', 'user1')
        formData.set('date', '2024-01-01')

        const result = await createExpenseAction(initialState, formData)

        expect(result.error).toBe('認証が必要です')
        expect(result.success).toBe(false)
    })
})

// ─── updateExpenseAction ──────────────────────────────────────────

describe('updateExpenseAction', () => {
    const initialState = { error: null, success: false }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('バリデーションエラー: amount が 0 のとき fieldErrors を返す', async () => {
        const formData = new FormData()
        formData.set('amount', '0')
        formData.set('balanceType', '0')
        formData.set('date', '2024-01-01')

        const result = await updateExpenseAction('expense-01', initialState, formData)

        expect(result.fieldErrors?.amount).toBeDefined()
        expect(serverFetch).not.toHaveBeenCalled()
    })

    it('バリデーションエラー: date が空のとき fieldErrors を返す', async () => {
        const formData = new FormData()
        formData.set('amount', '1000')
        formData.set('balanceType', '0')
        formData.set('date', '')

        const result = await updateExpenseAction('expense-01', initialState, formData)

        expect(result.fieldErrors?.date).toBeDefined()
        expect(serverFetch).not.toHaveBeenCalled()
    })

    it('正常系: 有効なデータで支出を更新し success を返す', async () => {
        vi.mocked(serverFetch).mockResolvedValue({})

        const formData = new FormData()
        formData.set('amount', '2000')
        formData.set('balanceType', '0')
        formData.set('date', '2024-02-01')

        const result = await updateExpenseAction('expense-01', initialState, formData)

        expect(result.success).toBe(true)
        expect(result.error).toBeNull()
        expect(serverFetch).toHaveBeenCalledWith(
            '/api/expense/expense-01',
            expect.objectContaining({ method: 'PUT' }),
        )
    })

    it('API が 403 を返すとき認証エラーメッセージを返す', async () => {
        vi.mocked(serverFetch).mockRejectedValue(new ApiError(403, 'Forbidden'))

        const formData = new FormData()
        formData.set('amount', '2000')
        formData.set('balanceType', '0')
        formData.set('date', '2024-02-01')

        const result = await updateExpenseAction('expense-01', initialState, formData)

        expect(result.error).toBe('認証が必要です')
        expect(result.success).toBe(false)
    })

    it('API が 404 を返すとき「見つかりません」メッセージを返す', async () => {
        vi.mocked(serverFetch).mockRejectedValue(new ApiError(404, 'Not Found'))

        const formData = new FormData()
        formData.set('amount', '2000')
        formData.set('balanceType', '0')
        formData.set('date', '2024-02-01')

        const result = await updateExpenseAction('expense-01', initialState, formData)

        expect(result.error).toBe('支出が見つかりません')
        expect(result.success).toBe(false)
    })
})
