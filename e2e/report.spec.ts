import { test, expect } from '@playwright/test'
import { ReportPage } from './pages/ReportPage'

/**
 * レポート画面 E2E テスト
 * - 期間切り替えはボタン式（週/月/先月）
 * - URL パラメータ: week / month / lastMonth（デフォルトは month）
 */
test.describe('レポート画面の期間切り替えとサマリー表示', () => {
    test.beforeEach(async ({ page }) => {
        const reportPage = new ReportPage(page)
        await reportPage.goto()
    })

    test('レポートページが正しく表示される', async ({ page }) => {
        const reportPage = new ReportPage(page)
        await reportPage.expectPeriodTabsVisible()
    })

    test('デフォルトで「今月」が選択されている', async ({ page }) => {
        // 省略時のデフォルトは month（URLパラメータなし、または period=month）
        const url = page.url()
        const hasNoParam = !url.includes('period=')
        const hasMonthParam = url.includes('period=month')
        expect(hasNoParam || hasMonthParam).toBe(true)
    })

    test('「直近7日」に切り替えるとURLパラメータが変わる', async ({ page }) => {
        const reportPage = new ReportPage(page)
        await reportPage.selectPeriod('week')
        await reportPage.expectUrlPeriod('week')
    })

    test('「先月」に切り替えるとURLパラメータが変わる', async ({ page }) => {
        const reportPage = new ReportPage(page)
        await reportPage.selectPeriod('lastMonth')
        await reportPage.expectUrlPeriod('lastMonth')
    })

    test('URLで period=month を指定するとレポートが表示される', async ({ page }) => {
        await page.goto('/report?period=month')
        // 「支出合計」は集計カードに加えて「カテゴリ別支出合計」見出しにも含まれるため exact マッチで限定する
        await expect(page.getByText('支出合計', { exact: true })).toBeVisible()
    })

    test('URLで period=lastMonth を指定するとレポートが表示される', async ({ page }) => {
        await page.goto('/report?period=lastMonth')
        await expect(page.getByText('支出合計', { exact: true })).toBeVisible()
    })
})
