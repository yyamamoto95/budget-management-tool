import { test, expect } from '@playwright/test'

/**
 * 未認証アクセスのガード検知テスト。
 *
 * apps/web/src/middleware.ts の `config.matcher` に並ぶ保護ルートへ、Cookie なしでアクセスしたとき
 * 必ず /login へリダイレクトされることを保証する。
 * Next.js のバージョン更新（matcher 実装の変更・middleware 回避系の脆弱性修正）で
 * 認証ゲートが外れていないかを機械的に検知するためのガード。
 *
 * リダイレクト自体を検証するため、自動追従を無効化（maxRedirects: 0）して応答ヘッダーを直接見る。
 */

// matcher の各パターンに対応する具体パス（`:path*` を含むものは実在しうる子パスで代表させる）
const PROTECTED_PATHS = [
    '/',
    '/calendar',
    '/records',
    '/records/2026-01',
    '/expenses/new',
    '/imports',
    '/report',
    '/report/summary',
    '/settings',
    '/settings/profile',
    '/setup',
    '/my-page',
] as const

// matcher から除外されている公開ルート（誤って保護されていないことの対照）
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'] as const

test.describe('未認証アクセスのガード', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    for (const path of PROTECTED_PATHS) {
        test(`保護ルート ${path} は /login へリダイレクトされる`, async ({ request }) => {
            const res = await request.get(path, { maxRedirects: 0 })

            expect(res.status()).toBeGreaterThanOrEqual(300)
            expect(res.status()).toBeLessThan(400)
            expect(new URL(res.headers()['location'], 'http://localhost').pathname).toBe('/login')
        })
    }

    for (const path of PUBLIC_PATHS) {
        test(`公開ルート ${path} はリダイレクトされず表示できる`, async ({ request }) => {
            const res = await request.get(path, { maxRedirects: 0 })

            expect(res.status()).toBe(200)
        })
    }
})
