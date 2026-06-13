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

        // PC サイドバー・モバイルヘッダー両方にロゴが存在する
        expect(screen.getAllByText('家計かんり').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('ホーム')).toBeInTheDocument()
        expect(screen.getByText('明細')).toBeInTheDocument()
        expect(screen.getByText('レポート')).toBeInTheDocument()
        expect(screen.getByText('設定')).toBeInTheDocument()
        // 「記録する」は CTA ボタン・サイドバー両方に存在する
        expect(screen.getAllByText('記録する').length).toBeGreaterThanOrEqual(1)
    })

    it('userName が渡されたとき、ユーザー名を表示する', () => {
        render(<Header userName="田中" />)

        expect(screen.getByText('田中')).toBeInTheDocument()
    })

    it('userName が未指定のとき、ユーザー名を表示しない', () => {
        render(<Header />)

        expect(screen.queryByText('田中')).not.toBeInTheDocument()
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

    it('現在のパスが /records のとき、明細がアクティブになる', () => {
        vi.mocked(usePathname).mockReturnValue('/records')
        render(<Header />)

        const recordsLink = screen.getByRole('link', { name: /明細/ })
        expect(recordsLink.className).toContain('text-[#f18840]')
    })

    it('サイドバー折りたたみボタンを押すと折りたたみ状態になる', () => {
        render(<Header />)

        const collapseButton = screen.getByRole('button', { name: 'サイドバーを折りたたむ' })
        fireEvent.click(collapseButton)

        // 折りたたんだ後は展開ボタンが表示される
        expect(screen.getByRole('button', { name: 'サイドバーを展開' })).toBeInTheDocument()
    })

    it('サイドバー展開ボタンを押すと展開状態に戻る', () => {
        render(<Header />)

        const collapseButton = screen.getByRole('button', { name: 'サイドバーを折りたたむ' })
        fireEvent.click(collapseButton)
        const expandButton = screen.getByRole('button', { name: 'サイドバーを展開' })
        fireEvent.click(expandButton)

        expect(screen.getByRole('button', { name: 'サイドバーを折りたたむ' })).toBeInTheDocument()
    })
})
