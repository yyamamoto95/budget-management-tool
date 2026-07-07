import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2Eテスト設定
 * baseURL: Next.js devサーバー（http://localhost:3000）を前提とする
 * auth.setup.ts でセッションを確立し、全テストで再利用する
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [['html', { open: 'never' }], ['list']],

    // 遅い CI runner ではデフォルト 5 秒の expect がタイムアウトしフレーキーの一因になる（#474）。
    // 同一コードはローカルで数秒で完走することを確認済みのため、緩和しても検知力は損なわれない。
    // テスト全体のタイムアウトも既定 30s のままだと 30s の expect より先に発火し
    // 不明瞭なエラーで終了するため、60s へ引き上げる。
    timeout: 60000,
    expect: { timeout: 15000 },

    use: {
        baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        // セッション確立フェーズ
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        // メインテスト（setupの後に実行、ストレージ状態を再利用）
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'e2e/.auth/user.json',
            },
            dependencies: ['setup'],
        },
    ],

    // ローカル開発時はNext.jsサーバーを自動起動しない（手動起動前提）
    // CI環境では外部から起動する
})
