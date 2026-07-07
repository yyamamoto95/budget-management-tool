import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * ホーム画面（/）の Page Object。
 *
 * BottomNav の FAB（クイック記録）から QuickEntryDrawer を開く動線を提供する。
 * FAB は md:hidden のためモバイルビューポートで使用すること。
 */
export class HomePage extends BasePage {
    protected readonly path = '/'

    protected async waitForReady(): Promise<void> {
        // RecentExpenses の見出しが表示されるまで待機
        await expect(this.page.getByText('最近の記録')).toBeVisible({ timeout: 15000 })
    }

    /** BottomNav の FAB をクリックして QuickEntryDrawer を開く */
    async openQuickEntry(): Promise<void> {
        await this.page.getByRole('button', { name: 'クイック記録' }).click()
    }

    /** ホーム画面の「最近の記録」セクションに指定テキストが表示されているか検証する */
    async expectRecentEntryVisible(text: string): Promise<void> {
        await expect(this.page.getByText(text)).toBeVisible({ timeout: 30000 })
    }
}
