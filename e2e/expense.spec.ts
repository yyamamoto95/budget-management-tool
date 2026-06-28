import { test, expect } from '@playwright/test'
import { ExpensePage } from './pages/ExpensePage'

/**
 * 収支記録 E2E テスト
 * - フォームは /expenses/new（ExpenseCreateForm）を使用
 * - /expenses は /records へリダイレクトされるため直接 /expenses/new へアクセスする
 */
test.describe('支出の新規登録と一覧反映', () => {
    test.beforeEach(async ({ page }) => {
        const expensePage = new ExpensePage(page)
        await expensePage.goto()
    })

    test('支出登録フォームが表示される', async ({ page }) => {
        await expect(page.getByLabel('金額（円）')).toBeVisible()
        await expect(page.getByLabel('日付')).toBeVisible()
        await expect(page.getByRole('button', { name: '支出' })).toBeVisible()
        await expect(page.getByRole('button', { name: '追加する' })).toBeVisible()
    })

    test('金額を入力せずに登録するとバリデーションが発動する', async ({ page }) => {
        const expensePage = new ExpensePage(page)
        // 金額を空のまま送信
        await expensePage.submit()
        // HTML5 required バリデーションにより金額フィールドへフォーカスが戻る
        await expensePage.expectAmountFocused()
    })

    test('有効なデータで支出を登録すると成功メッセージが表示される', async ({ page }) => {
        const today = new Date().toISOString().split('T')[0]
        const expensePage = new ExpensePage(page)

        await expensePage.fillAmount('1500')
        await expensePage.fillDate(today)
        await expensePage.submit()

        await expensePage.expectSaveSucceeded()
    })

    test('支出登録後に一覧に反映される', async ({ page }) => {
        const today = new Date().toISOString().split('T')[0]
        const uniqueMemo = `E2E反映確認テスト-${Date.now()}`
        const expensePage = new ExpensePage(page)

        await expensePage.fillAmount('2000')
        await expensePage.fillDate(today)
        await expensePage.fillMemo(uniqueMemo)
        await expensePage.submit()

        await expensePage.expectSaveSucceeded()

        // /records ページで登録したメモが一覧に反映されていることを確認
        await page.goto('/records')
        await expect(page.getByText(uniqueMemo)).toBeVisible({ timeout: 10000 })
    })

    test('ログアウトボタンが表示され、クリックするとログインページに遷移する', async ({ page }) => {
        const logoutButton = page.getByRole('button', { name: 'ログアウト' })
        await expect(logoutButton).toBeVisible()

        await logoutButton.click()

        await expect(page).toHaveURL('/login', { timeout: 10000 })
    })
})
