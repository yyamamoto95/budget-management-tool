import { test, expect, type Page } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { QuickEntryPage } from './pages/QuickEntryPage'

/**
 * 生活余力 E2E テスト（US-402 / #418）
 *
 * 検証する継ぎ目（seam）:
 *   API(GET /dashboard) → calculateLivingMargin(@budget/common) → ホームのカード表示
 *   支出登録（QuickEntryDrawer） → Server Action → 即時フィードバック表示
 *
 * データ準備は API 直叩き（Bearer トークン）で行い、UI 検証に集中する。
 * 変更した設定はテスト後に元へ戻す。
 */

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://localhost:5000'

/** ブラウザコンテキストの access_token を Bearer ヘッダーに変換する */
async function bearerHeaders(page: Page): Promise<{ Authorization: string }> {
    const cookies = await page.context().cookies()
    const accessToken = cookies.find((c) => c.name === 'access_token')?.value
    expect(accessToken, 'access_token cookie が必要です').toBeTruthy()
    return { Authorization: `Bearer ${accessToken}` }
}

/** ローカル日付を YYYY-MM-DD で返す */
function localDateStr(daysAgo: number): string {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

test.describe('生活余力（US-402）', () => {
    // QuickEntryDrawer（FAB）は md:hidden のためモバイルビューポートで実行する
    test.use({ viewport: { width: 390, height: 844 } })

    test('ホームに生活余力カード（数値または算出不能の案内）が常時表示される', async ({ page }) => {
        const home = new HomePage(page)
        await home.goto()

        const card = page.getByTestId('living-margin-card')
        await expect(card).toBeVisible()
        await expect(card.getByText('生活余力')).toBeVisible()
    })

    test('記録が溜まった状態で余力（月数）が表示され、支出登録で変化がフィードバックされる', async ({ page }) => {
        const memoTag = `e2e-margin-${Date.now()}`
        const home = new HomePage(page)
        await home.goto()
        const headers = await bearerHeaders(page)

        // 現在の設定を退避（テスト後に復元する）
        const settingsRes = await page.request.get(`${API_BASE}/api/settings`, { headers })
        expect(settingsRes.ok()).toBeTruthy()
        const originalSettings = await settingsRes.json()

        // カテゴリ ID を取得（支出カテゴリの先頭）
        const catRes = await page.request.get(`${API_BASE}/api/categories?balanceType=0`, { headers })
        expect(catRes.ok()).toBeTruthy()
        const categoryId: number = (await catRes.json())[0].id

        // ユーザー ID は cookie から取得（ゲスト運用時は 'Guest'）
        const userId =
            (await page.context().cookies()).find((c) => c.name === 'user_id')?.value ?? 'Guest'

        try {
            // 総資産・月収を設定し、初回設定完了扱いにする
            const putRes = await page.request.put(`${API_BASE}/api/settings`, {
                headers,
                data: {
                    totalAssets: 960_000,
                    monthlyIncome: 250_000,
                    paydayDay: originalSettings.paydayDay ?? 25,
                    fixedExpenses: originalSettings.fixedExpenses ?? 0,
                    initialSetupCompleted: true,
                },
            })
            expect(putRes.ok()).toBeTruthy()

            // 過去7日分の支出を API 経由で投入（記録日数ガード n>=7 を満たす）
            for (let i = 1; i <= 7; i++) {
                const res = await page.request.post(`${API_BASE}/api/expense`, {
                    headers,
                    data: {
                        newData: {
                            amount: 8000,
                            balanceType: 0,
                            categoryId,
                            userId,
                            date: localDateStr(i),
                            content: memoTag,
                        },
                    },
                })
                expect(res.ok()).toBeTruthy()
            }

            // ホーム再読み込み → 生活余力（◯ヶ月分）が表示される
            await page.reload()
            const card = page.getByTestId('living-margin-card')
            await expect(card).toBeVisible()
            await expect(card.getByText('ヶ月分', { exact: true })).toBeVisible({ timeout: 10000 })

            // FAB から支出を登録し、生活余力の変化がフィードバックされる
            await home.openQuickEntry()
            const drawer = new QuickEntryPage(page)
            await drawer.waitForOpen()
            await drawer.enterAmount(4000)
            await drawer.fillMemo(memoTag)
            await drawer.submit()
            await drawer.expectSuccess()
            await expect(page.getByRole('dialog').getByText(/生活余力/)).toBeVisible({
                timeout: 10000,
            })
        } finally {
            // 投入した支出を削除（メモで検索して取りこぼしも回収）
            const searchRes = await page.request.get(
                `${API_BASE}/api/expense?search=${encodeURIComponent(memoTag)}`,
                { headers },
            )
            if (searchRes.ok()) {
                const body = await searchRes.json().catch(() => null)
                for (const e of body?.expense ?? []) {
                    await page.request.delete(`${API_BASE}/api/expense/${e.id}`, { headers })
                }
            }

            // 設定を元に戻す
            await page.request.put(`${API_BASE}/api/settings`, {
                headers,
                data: {
                    totalAssets: originalSettings.totalAssets ?? 0,
                    monthlyIncome: originalSettings.monthlyIncome ?? 0,
                    paydayDay: originalSettings.paydayDay ?? 25,
                    fixedExpenses: originalSettings.fixedExpenses ?? 0,
                    initialSetupCompleted: originalSettings.initialSetupCompleted ?? false,
                },
            })
        }
    })
})
