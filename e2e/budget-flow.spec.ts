import { test } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { QuickEntryPage } from './pages/QuickEntryPage'
import { RecordsPage } from './pages/RecordsPage'
import { ExpensePage } from './pages/ExpensePage'

/**
 * 家計登録フロー E2E テスト
 * auth.setup.ts で確立したログインセッションを再利用する。
 *
 * 検証する継ぎ目（seam）:
 *   UI 操作 → Server Action(createExpenseAction) → API(POST /expense) → DB → 明細一覧反映
 * ユースケース:
 *   1. モバイル: QuickEntryDrawer（FAB）で支出を登録 → 明細に反映
 *   2. モバイル: QuickEntryDrawer（FAB）で収入を登録 → 明細に反映
 *   3. デスクトップ: /expenses/new フォームで支出を登録 → 明細に反映
 */

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://localhost:5000'

/** テスト後のデータクリーンアップ（メモで検索して該当IDを全削除）
 *
 * API は Authorization: Bearer <JWT> を要求する。
 * Cookie 経由のセッションは Next.js (port 3000) 専用で、page.request から localhost:5000 へ直接叩く際は
 * cookie だけでは 401 になるため、ブラウザコンテキストから access_token を取り出して Bearer ヘッダーで付与する。
 */
async function cleanupByMemo(
    page: import('@playwright/test').Page,
    memo: string,
): Promise<void> {
    const cookies = await page.context().cookies()
    const accessToken = cookies.find((c) => c.name === 'access_token')?.value
    if (!accessToken) return
    const headers = { Authorization: `Bearer ${accessToken}` }

    const res = await page.request.get(
        `${API_BASE}/api/expense?search=${encodeURIComponent(memo)}`,
        { headers },
    )
    if (!res.ok()) return
    const body = await res.json().catch(() => null)
    for (const e of body?.expense ?? []) {
        await page.request.delete(`${API_BASE}/api/expense/${e.id}`, { headers })
    }
}

// ─────────────────────────────────────────────────────────
// ユースケース 1・2: QuickEntryDrawer（モバイル）
// ─────────────────────────────────────────────────────────
test.describe('QuickEntryDrawer（モバイル）での家計登録フロー', () => {
    // BottomNav の FAB は md:hidden のためモバイルビューポートを指定
    test.use({ viewport: { width: 390, height: 844 } })

    let testMemo = ''

    test.afterEach(async ({ page }) => {
        if (testMemo) {
            await cleanupByMemo(page, testMemo)
            // 次テストの beforeEach/前段で失敗した場合に前回 memo を再処理しないようリセット
            testMemo = ''
        }
    })

    test('支出を登録して明細に反映される', async ({ page }) => {
        testMemo = `e2e-expense-${Date.now()}`

        const home = new HomePage(page)
        await home.goto()
        await home.openQuickEntry()

        const drawer = new QuickEntryPage(page)
        await drawer.waitForOpen()
        // 支出がデフォルトのため selectBalanceType 不要
        await drawer.enterAmount(800)
        await drawer.selectCategory('食費')
        await drawer.fillMemo(testMemo)
        await drawer.submit()
        await drawer.expectSuccess()

        // 明細ページへ遷移して登録内容を確認
        const records = new RecordsPage(page)
        await records.gotoWithSearch(testMemo)
        await records.expectEntryVisible(testMemo)
    })

    test('収入を登録して明細に反映される', async ({ page }) => {
        testMemo = `e2e-income-${Date.now()}`

        const home = new HomePage(page)
        await home.goto()
        await home.openQuickEntry()

        const drawer = new QuickEntryPage(page)
        await drawer.waitForOpen()
        await drawer.selectBalanceType('収入')
        await drawer.enterAmount(50000)
        await drawer.selectCategory('給料')
        await drawer.fillMemo(testMemo)
        await drawer.submit()
        await drawer.expectSuccess()

        const records = new RecordsPage(page)
        await records.gotoWithSearch(testMemo)
        await records.expectEntryVisible(testMemo)
    })
})

// ─────────────────────────────────────────────────────────
// ユースケース 3: /expenses/new フォーム（デスクトップ）
// ─────────────────────────────────────────────────────────
test.describe('/expenses/new フォームでの家計登録フロー', () => {
    let testMemo = ''

    test.afterEach(async ({ page }) => {
        if (testMemo) {
            await cleanupByMemo(page, testMemo)
            // 次テストの beforeEach/前段で失敗した場合に前回 memo を再処理しないようリセット
            testMemo = ''
        }
    })

    test('フォームから支出を登録して明細に反映される', async ({ page }) => {
        testMemo = `e2e-form-${Date.now()}`
        const today = new Date().toISOString().split('T')[0]

        const expensePage = new ExpensePage(page)
        await expensePage.goto()
        await expensePage.fillAmount('1500')
        await expensePage.fillDate(today)
        await expensePage.fillMemo(testMemo)
        await expensePage.submit()
        await expensePage.expectSaveSucceeded()

        const records = new RecordsPage(page)
        await records.gotoWithSearch(testMemo)
        await records.expectEntryVisible(testMemo)
    })
})
