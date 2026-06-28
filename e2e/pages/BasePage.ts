import type { Page } from '@playwright/test'

/**
 * Page Object の共通基底クラス。
 *
 * 各画面の Page Object はこれを継承し、セレクタと操作を 1 箇所に集約する。
 * spec ファイルは Page Object のメソッドだけを呼び、生のセレクタを書かない
 * （= UI 変更時の修正範囲を Page Object に閉じ込め、横展開・保守性を担保する）。
 */
export abstract class BasePage {
    constructor(protected readonly page: Page) {}

    /** この画面の URL パス（例: '/settings'） */
    protected abstract readonly path: string

    /** 画面へ遷移し、表示完了まで待機する */
    async goto(): Promise<void> {
        await this.page.goto(this.path)
        await this.waitForReady()
    }

    /** リロードして表示完了まで待機する（永続化検証で利用） */
    async reload(): Promise<void> {
        await this.page.reload()
        await this.waitForReady()
    }

    /**
     * 画面の表示完了シグナル。各 Page Object で「これが見えたら操作可能」という
     * 安定要素（見出し・主要ボタン等）を待機するよう実装する。
     */
    protected abstract waitForReady(): Promise<void>
}
