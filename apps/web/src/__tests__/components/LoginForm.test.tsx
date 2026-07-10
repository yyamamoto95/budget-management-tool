import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import * as Sonner from 'sonner'
import { LoginForm } from '../../components/login/LoginForm'

// Server Actionをモック
vi.mock('@/lib/actions/auth', () => ({
    loginAction: vi.fn(),
    guestLoginAction: vi.fn(),
}))

// SessionExpiredToast は sonner の toast を使うためモック
vi.mock('sonner', () => ({
    toast: Object.assign(vi.fn(), {
        warning: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
    }),
}))

// useSearchParams が jsdom で null を返す問題を回避
vi.mock('next/navigation', () => ({
    useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}))

// ESM環境ではvi.spyOnは不可。vi.mockでuseActionStateをモックする
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>()
    return {
        ...actual,
        useActionState: vi.fn(),
    }
})

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('初期表示: フォームとラベルが描画される', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<LoginForm />)

        expect(screen.getByLabelText('ユーザー名')).toBeInTheDocument()
        expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'ログインする' })).toBeInTheDocument()
    })

    it('fieldErrors.userId があるとき、エラーメッセージを表示する', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, fieldErrors: { userId: ['ユーザーIDを入力してください'] } },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<LoginForm />)

        expect(screen.getByText('ユーザーIDを入力してください')).toBeInTheDocument()
    })

    it('fieldErrors.password があるとき、エラーメッセージを表示する', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null, fieldErrors: { password: ['パスワードを入力してください'] } },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<LoginForm />)

        expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument()
    })

    it('state.error があるとき、エラーメッセージを表示する', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: '認証に失敗しました' },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<LoginForm />)

        expect(screen.getByText('認証に失敗しました')).toBeInTheDocument()
    })

    it('isPending=true のとき、ボタンが disabled になる', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null },
            vi.fn(),
            true,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<LoginForm />)

        const button = screen.getByRole('button', { name: 'ログイン中...' })
        expect(button).toBeDisabled()
    })

    it('sessionExpired でも returnTo の hidden input は出力されない（ログイン後は常にホームへ遷移 #549）', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        const { container } = render(<LoginForm sessionExpired />)

        expect(container.querySelector('input[name="returnTo"]')).toBeNull()
    })

    it('sessionExpired のとき、セッション切れトーストが呼ばれる', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<LoginForm sessionExpired />)

        expect(vi.mocked(Sonner.toast.warning)).toHaveBeenCalledWith(
            'セッションが切れました。再度ログインしてください。',
            expect.objectContaining({ duration: 5000 }),
        )
    })

    it('sessionExpired でないとき、セッション切れトーストが呼ばれない', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<LoginForm />)

        expect(vi.mocked(Sonner.toast.warning)).not.toHaveBeenCalled()
    })

    it('ブランドキャッチコピーが表示される', () => {
        vi.mocked(React.useActionState).mockReturnValue([
            { error: null },
            vi.fn(),
            false,
        ] as unknown as ReturnType<typeof React.useActionState>)

        render(<LoginForm />)

        expect(screen.getByText('家計を、もっとシンプルに。')).toBeInTheDocument()
        expect(screen.getByText('Budget')).toBeInTheDocument()
    })
})
