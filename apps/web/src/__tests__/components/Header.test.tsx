import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../../components/layout/Header'

vi.mock('@/lib/actions/auth', () => ({
    logoutAction: vi.fn(),
}))

vi.mock('next/link', () => ({
    default: ({
        href,
        children,
        onClick,
        className,
    }: {
        href: string
        children: React.ReactNode
        onClick?: () => void
        className?: string
    }) => (
        <a href={href} onClick={onClick} className={className}>
            {children}
        </a>
    ),
}))

vi.mock('next/navigation', () => ({
    usePathname: vi.fn().mockReturnValue('/'),
}))

import { usePathname } from 'next/navigation'

describe('Header', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(usePathname).mockReturnValue('/')
    })

    it('正常表示: ロゴ・ナビ・記録するボタンが描画される', () => {
        render(<Header />)

        expect(screen.getByText('家計簿')).toBeInTheDocument()
        expect(screen.getByText('ホーム')).toBeInTheDocument()
        expect(screen.getByText('カレンダー')).toBeInTheDocument()
        expect(screen.getByText('レポート')).toBeInTheDocument()
        // 「記録する」は CTA ボタンとデスクトップ・モバイル両方に存在する
        expect(screen.getAllByText('記録する').length).toBeGreaterThanOrEqual(1)
    })

    it('userName が渡されたとき、ユーザー名を表示する', () => {
        render(<Header userName="田中" />)

        expect(screen.getByText('田中さん')).toBeInTheDocument()
    })

    it('userName が未指定のとき、ユーザー名を表示しない', () => {
        render(<Header />)

        expect(screen.queryByText('さん')).not.toBeInTheDocument()
    })

    it('ログアウトボタンが描画される', () => {
        render(<Header />)

        expect(screen.getAllByRole('button', { name: /ログアウト/ }).length).toBeGreaterThanOrEqual(1)
    })

    it('現在のパスが / のとき、ホームがアクティブになる', () => {
        vi.mocked(usePathname).mockReturnValue('/')
        render(<Header />)

        const homeLink = screen.getByRole('link', { name: /ホーム/ })
        expect(homeLink.className).toContain('text-[#f18840]')
    })

    it('現在のパスが /calendar のとき、カレンダーがアクティブになる', () => {
        vi.mocked(usePathname).mockReturnValue('/calendar')
        render(<Header />)

        const calendarLink = screen.getByRole('link', { name: /カレンダー/ })
        expect(calendarLink.className).toContain('text-[#f18840]')
    })

    it('モバイルメニューボタンを押すとメニューが表示される', () => {
        render(<Header />)

        // 初期状態ではモバイルメニューは非表示
        expect(screen.queryByRole('dialog', { name: 'モバイルメニュー' })).not.toBeInTheDocument()

        // ハンバーガーボタンをクリック
        const menuButton = screen.getByRole('button', { name: 'メニューを開く' })
        fireEvent.click(menuButton)

        // メニューが表示される
        expect(screen.getByRole('dialog', { name: 'モバイルメニュー' })).toBeInTheDocument()
    })

    it('モバイルメニュー表示中に閉じるボタンを押すと非表示になる', () => {
        render(<Header />)

        const menuButton = screen.getByRole('button', { name: 'メニューを開く' })
        fireEvent.click(menuButton)

        const closeButton = screen.getByRole('button', { name: 'メニューを閉じる' })
        fireEvent.click(closeButton)

        expect(screen.queryByRole('dialog', { name: 'モバイルメニュー' })).not.toBeInTheDocument()
    })

    it('モバイルメニュー内のリンクをクリックするとメニューが閉じる', () => {
        vi.mocked(usePathname).mockReturnValue('/')
        render(<Header />)

        fireEvent.click(screen.getByRole('button', { name: 'メニューを開く' }))
        expect(screen.getByRole('dialog', { name: 'モバイルメニュー' })).toBeInTheDocument()

        // モバイルメニュー内のカレンダーリンクをクリック
        const dialog = screen.getByRole('dialog', { name: 'モバイルメニュー' })
        const calendarLink = dialog.querySelector('a[href="/calendar"]')
        expect(calendarLink).not.toBeNull()
        fireEvent.click(calendarLink!)

        expect(screen.queryByRole('dialog', { name: 'モバイルメニュー' })).not.toBeInTheDocument()
    })
})
