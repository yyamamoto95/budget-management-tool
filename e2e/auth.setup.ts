import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

/**
 * 認証セットアップ
 * ログイン操作を1回実行し、セッション情報を .auth/user.json に保存する。
 * 以降のテストはこのストレージ状態を再利用し、毎回ログインをスキップする。
 *
 * ログイン方式:
 *   - 既定: seed 済みゲストユーザー（userId: 'Guest'）でゲストログイン（認証情報不要）。
 *     → `pnpm --filter @budget/api run seed` で投入される。
 *   - E2E_USER_ID / E2E_PASSWORD が指定された場合は通常ログイン（CI・専用ユーザー用）。
 */
setup('ユーザーログインとセッション確立', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()

    const userId = process.env.E2E_USER_ID
    const password = process.env.E2E_PASSWORD

    if (userId && password) {
        // 認証情報が指定された場合は通常ログイン
        await page.getByLabel('ユーザー名').fill(userId)
        await page.getByLabel('パスワード').fill(password)
        await page.getByRole('button', { name: 'ログインする' }).click()
    } else {
        // 既定はゲストログイン（seed 済み Guest を使用、認証情報不要）
        await page.getByRole('button', { name: 'ゲストユーザーでログイン' }).click()
    }

    // ログイン成功後、ログインページから離脱するまで待つ
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })

    // 初回設定を確実に完了させる（未完了ユーザーは保護ルートで /setup へ弾かれるため）。
    // /setup はウィザードを表示する。完了済みなら "/" へリダイレクトされ、スキップボタンは出ない。
    await page.goto('/setup')
    const skipButton = page.getByRole('button', { name: 'あとで設定する' })
    if (await skipButton.isVisible().catch(() => false)) {
        await skipButton.click()
        await page.waitForURL((url) => !url.pathname.startsWith('/setup'), { timeout: 15000 })
    }

    // 認証済みであることを確認（/settings は初回設定免除ルートで常にアクセス可能）
    await page.goto('/settings')
    await expect(page.getByRole('button', { name: '設定を保存する' })).toBeVisible({ timeout: 10000 })

    // セッション状態をファイルに保存
    await page.context().storageState({ path: authFile })
})
