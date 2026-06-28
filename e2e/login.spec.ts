import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

test.describe('ログイン画面', () => {
    test.use({ storageState: { cookies: [], origins: [] } }) // 未認証状態でテスト

    test('ログインページが正しく表示される', async ({ page }) => {
        const loginPage = new LoginPage(page)
        await loginPage.goto()

        await expect(page.getByLabel('ユーザー名')).toBeVisible()
        await expect(page.getByLabel('パスワード')).toBeVisible()
        await expect(page.getByRole('button', { name: 'ログインする' })).toBeVisible()
    })

    test('ユーザーIDが空のままログインするとバリデーションが発動する', async ({ page }) => {
        const loginPage = new LoginPage(page)
        await loginPage.goto()

        // パスワードのみ入力してサブミット
        await loginPage.fillPasswordOnly('password123')
        await loginPage.submit()

        // HTML5 required バリデーションにより userId フィールドへフォーカスが戻る
        await loginPage.expectUserIdFocused()
    })

    test('パスワードが空のままログインするとバリデーションが発動する', async ({ page }) => {
        const loginPage = new LoginPage(page)
        await loginPage.goto()

        // userId のみ入力してサブミット
        await loginPage.fillUserIdOnly('user-1')
        await loginPage.submit()

        // HTML5 required バリデーションにより password フィールドへフォーカスが戻る
        await loginPage.expectPasswordFocused()
    })

    test('誤った認証情報でログインすると認証エラーが表示される', async ({ page }) => {
        const loginPage = new LoginPage(page)
        await loginPage.goto()

        await loginPage.login('wrong-user', 'wrong-password')

        // 認証エラーメッセージの表示を確認（ページ遷移しない）
        await expect(page).toHaveURL('/login')
    })
})

test.describe('セッション維持', () => {
    test('ログイン済みで /records にアクセスできる', async ({ page }) => {
        // storageState は playwright.config.ts の project 設定で注入済み
        await page.goto('/records')

        // ログインページにリダイレクトされないことを確認
        await expect(page).toHaveURL('/records')
        await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible()
    })
})
