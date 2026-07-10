import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '../../lib/api/client'

// serverFetch と redirect をモック
vi.mock('../../lib/api/client', () => ({
    ApiError: class ApiError extends Error {
        constructor(public readonly status: number, message: string) {
            super(message)
            this.name = 'ApiError'
        }
    },
    serverFetch: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

// next/headers の cookies をモック（JWT Cookie セット処理）
vi.mock('next/headers', () => ({
    cookies: vi.fn().mockResolvedValue({
        set: vi.fn(),
        delete: vi.fn(),
        get: vi.fn().mockReturnValue(undefined),
    }),
}))

import { loginAction, guestLoginAction } from '../../lib/actions/auth'
import { serverFetch } from '../../lib/api/client'
import { redirect } from 'next/navigation'

const TOKEN_RESPONSE = {
    result: 'success',
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    userId: 'user1',
}

describe('guestLoginAction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('body なしで /api/guest-login を呼ぶ（credentials は API 側で管理）', async () => {
        vi.mocked(serverFetch).mockResolvedValue(TOKEN_RESPONSE)

        await guestLoginAction(new FormData())

        expect(serverFetch).toHaveBeenCalledWith('/api/guest-login', { method: 'POST' })
    })

    it('ログイン成功後に / へリダイレクトする', async () => {
        vi.mocked(serverFetch).mockResolvedValue(TOKEN_RESPONSE)

        await guestLoginAction(new FormData())

        expect(redirect).toHaveBeenCalledWith('/')
    })

    it('returnTo が渡されても常に /（ホーム）へリダイレクトする（#549）', async () => {
        vi.mocked(serverFetch).mockResolvedValue(TOKEN_RESPONSE)

        const formData = new FormData()
        formData.set('returnTo', '/report')

        await guestLoginAction(formData)

        expect(redirect).toHaveBeenCalledWith('/')
    })

    it('API エラー時は ApiError をスローする', async () => {
        vi.mocked(serverFetch).mockRejectedValue(new ApiError(500, 'Something broken'))

        await expect(guestLoginAction(new FormData())).rejects.toBeInstanceOf(ApiError)
    })
})

describe('loginAction', () => {
    const initialState = { error: null }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('バリデーションエラー: userId が空のとき fieldErrors を返す', async () => {
        const formData = new FormData()
        formData.set('userId', '')
        formData.set('password', 'pass')

        const result = await loginAction(initialState, formData)

        expect(result.fieldErrors?.userId).toBeDefined()
        expect(serverFetch).not.toHaveBeenCalled()
    })

    it('バリデーションエラー: password が空のとき fieldErrors を返す', async () => {
        const formData = new FormData()
        formData.set('userId', 'user1')
        formData.set('password', '')

        const result = await loginAction(initialState, formData)

        expect(result.fieldErrors?.password).toBeDefined()
        expect(serverFetch).not.toHaveBeenCalled()
    })

    it('API が 401 を返すとき認証エラーメッセージを返す', async () => {
        vi.mocked(serverFetch).mockRejectedValue(new ApiError(401, '認証に失敗しました'))

        const formData = new FormData()
        formData.set('userId', 'user1')
        formData.set('password', 'wrong')

        const result = await loginAction(initialState, formData)

        expect(result.error).toBeTruthy()
        expect(redirect).not.toHaveBeenCalled()
    })

    it('ログイン成功後に / へリダイレクトする', async () => {
        vi.mocked(serverFetch).mockResolvedValue(TOKEN_RESPONSE)

        const formData = new FormData()
        formData.set('userId', 'user1')
        formData.set('password', 'pass')

        await loginAction(initialState, formData)

        expect(redirect).toHaveBeenCalledWith('/')
    })

    it('returnTo が渡されても常に /（ホーム）へリダイレクトする（#549）', async () => {
        vi.mocked(serverFetch).mockResolvedValue(TOKEN_RESPONSE)

        const formData = new FormData()
        formData.set('userId', 'user1')
        formData.set('password', 'pass')
        formData.set('returnTo', '/expenses')

        await loginAction(initialState, formData)

        expect(redirect).toHaveBeenCalledWith('/')
    })

    it('returnTo が外部URLでも /（ホーム）へリダイレクトする（オープンリダイレクト不能）', async () => {
        vi.mocked(serverFetch).mockResolvedValue(TOKEN_RESPONSE)

        const formData = new FormData()
        formData.set('userId', 'user1')
        formData.set('password', 'pass')
        formData.set('returnTo', 'https://evil.example.com/phishing')

        await loginAction(initialState, formData)

        expect(redirect).toHaveBeenCalledWith('/')
    })
})
