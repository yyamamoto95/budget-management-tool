import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

/**
 * セッション永続化のデグレ検知テスト。
 *
 * 「ログイン後にリロードするとログアウト扱いになる」類の不具合を機械的に防ぐためのガード。
 * middleware（access_token 検証・refresh rotation・/login リダイレクト）と
 * Server Action 経由の Cookie 設定が、リロードを跨いで一貫することを保証する。
 *
 * シナリオ:
 *   A. 認証済み状態で各保護ルートを開き、リロード後も維持される
 *   B. 未認証から /login でログイン → 直後にリロードしても維持される
 *   C. 連続リロードでも維持される（refresh token rotation の冪等性検証）
 *   D. access_token が無効でも refresh_token が有効ならリロードで復帰
 *   E. 両方無効なら /login へ飛ぶ（境界の正常挙動）
 */

// /calendar は意図的に /records へリダイレクトされるため検証対象外
const PROTECTED_PATHS = ['/', '/records', '/report', '/settings', '/my-page'] as const

test.describe('セッション永続化（リロード後もログイン維持）', () => {
    for (const path of PROTECTED_PATHS) {
        test(`A: 認証済みで ${path} にアクセス → リロード後も ${path} に留まる`, async ({ page }) => {
            await page.goto(path)
            await expect(page).toHaveURL(path)

            await page.reload()

            await expect(page).not.toHaveURL(/\/login/)
            await expect(page).toHaveURL(path)
        })
    }

    test('C: 認証済みで連続2回リロードしても / に留まる（refresh rotation 冪等性）', async ({ page }) => {
        await page.goto('/')
        await page.reload()
        await page.reload()
        await expect(page).not.toHaveURL(/\/login/)
        await expect(page).toHaveURL('/')
    })

    test.describe('D: リフレッシュ経路の検証（試行ごとに独立セッション）', () => {
        // 共有 storageState の refresh_token は一度 rotation すると reuse 検知で失効し、
        // リトライが構造的に成功しなくなる（遅い runner で初回失敗 → 全リトライ必敗）。
        // 専用ユーザーを払い出し、試行ごとに新しい rotation family でテストする。
        test.use({ storageState: { cookies: [], origins: [] } })

        test('D: access_token が無効でも refresh_token が有効ならリロード後も維持される', async ({ page, context, request }) => {
            const userId = `refresh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
            const password = 'Passw0rd!'
            const apiBase = process.env.INTERNAL_API_URL ?? 'http://localhost:5000'
            const registerRes = await request.post(`${apiBase}/api/register`, {
                data: { userId, password, securityQuestionId: 1, securityAnswer: 'tokyo' },
            })
            expect(registerRes.status()).toBe(201)

            const loginPage = new LoginPage(page)
            await loginPage.goto()
            await loginPage.login(userId, password)
            await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })

            // ログイン直後のリダイレクトが確定してから現在地を記録する
            await page.goto('/')
            await page.waitForLoadState()
            const landedPath = new URL(page.url()).pathname

            // access_token を意図的に壊す（middleware のリフレッシュ経路を刺激）
            const cookies = await context.cookies()
            const refresh = cookies.find((c) => c.name === 'refresh_token')
            expect(refresh, 'refresh_token が無いとテスト不可').toBeDefined()
            await context.clearCookies({ name: 'access_token' })
            await context.addCookies([
                {
                    name: 'access_token',
                    value: 'invalid.jwt.value',
                    domain: new URL(page.url()).hostname,
                    path: '/',
                    httpOnly: true,
                    sameSite: 'Strict',
                },
            ])

            await page.reload()
            // 遅い runner ではリフレッシュ往復がデフォルト 5 秒を超えるため緩和する
            await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
            await expect(page).toHaveURL(landedPath)
        })
    })

    test('E: access_token も refresh_token も両方とも無効ならログイン画面に飛ぶ（正常な期待挙動）', async ({ page, context }) => {
        await page.goto('/')
        await context.clearCookies({ name: 'access_token' })
        await context.clearCookies({ name: 'refresh_token' })

        await page.reload()
        await expect(page).toHaveURL(/\/login/)
    })

    test.describe('B: 未認証から新規ログイン直後のリロード', () => {
        // このブロックだけ未認証状態でテストする
        test.use({ storageState: { cookies: [], origins: [] } })

        test('B-1: ゲストログイン成功 → 直後にリロードしても /login に戻らない', async ({ page }) => {
            const loginPage = new LoginPage(page)
            await loginPage.goto()

            await page.getByRole('button', { name: 'ゲストユーザーでログイン' }).click()
            await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })

            const beforeReloadUrl = new URL(page.url()).pathname
            expect(beforeReloadUrl).not.toMatch(/^\/login/)

            await page.reload()
            await expect(page).not.toHaveURL(/\/login/)
        })

        test('B-2: 通常アカウントログイン成功 → 直後にリロードしても /login に戻らない', async ({ page, request }) => {
            // 各テスト用ユーザーを API 経由で作成（一意な userId）
            const userId = `reload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
            const password = 'Passw0rd!'
            const apiBase = process.env.INTERNAL_API_URL ?? 'http://localhost:5000'
            const registerRes = await request.post(`${apiBase}/api/register`, {
                data: { userId, password, securityQuestionId: 1, securityAnswer: 'tokyo' },
            })
            expect(registerRes.status()).toBe(201)

            // UI からログイン
            const loginPage = new LoginPage(page)
            await loginPage.goto()
            await loginPage.login(userId, password)

            // ログインページから離脱するまで待つ
            await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })

            const beforeReloadUrl = new URL(page.url()).pathname
            expect(beforeReloadUrl).not.toMatch(/^\/login/)

            // ★デグレ検知の核: リロード後もログインページに戻らないこと
            await page.reload()
            await expect(page).not.toHaveURL(/\/login/)
        })
    })
})
