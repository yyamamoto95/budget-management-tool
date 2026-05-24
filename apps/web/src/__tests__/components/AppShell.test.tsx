/**
 * AppShell レイアウト構造テスト
 *
 * 【目的】
 * - モバイルでコンテンツが正しく縦積みになることを保証する
 * - flex-col（モバイル縦積み）が欠落するリグレッションを防ぐ
 *
 * 【背景】
 * PR #157（Issue #141）で AppShell の外側ラッパーから flex-col が削除され、
 * モバイルビューでヘッダーとコンテンツが横並びになる不具合が発生した。
 *
 * 【注意】
 * AppShell は async Server Component のため、直接 render() に渡せない。
 * async 関数を直接 await して戻り値の JSX を render する方式で対応する。
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { AppShell } from '../../components/layout/AppShell'
import type React from 'react'

vi.mock('../../components/layout/Header', () => ({
    Header: () => <div data-testid="mock-header" />,
}))

vi.mock('../../components/layout/BottomNav', () => ({
    BottomNav: () => <div data-testid="mock-bottom-nav" />,
}))

vi.mock('@/lib/api/category', () => ({
    getCategories: vi.fn().mockResolvedValue([]),
}))

describe('AppShell', () => {
    it('外側ラッパーに flex-col クラスが含まれる（モバイル縦積みのリグレッション防止）', async () => {
        const element = await AppShell({ children: <div data-testid="content">コンテンツ</div> }) as React.ReactElement
        const { container } = render(element)

        // 最外側の div が flex-col を持つことを確認する
        // これが欠落するとモバイルでヘッダーとコンテンツが横並びになる
        const outerDiv = container.firstChild as HTMLElement
        expect(outerDiv.className).toContain('flex-col')
    })

    it('children が描画される', async () => {
        const element = await AppShell({ children: <div data-testid="content">コンテンツ</div> }) as React.ReactElement
        const { getByTestId } = render(element)

        expect(getByTestId('content')).toBeInTheDocument()
    })

    it('PC 向けに md:flex-row クラスが含まれる', async () => {
        const element = await AppShell({ children: <div>コンテンツ</div> }) as React.ReactElement
        const { container } = render(element)

        const outerDiv = container.firstChild as HTMLElement
        expect(outerDiv.className).toContain('md:flex-row')
    })
})
