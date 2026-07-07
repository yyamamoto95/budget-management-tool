import { expect, type Page, type Locator } from '@playwright/test'

/**
 * QuickEntryDrawer の Page Object。
 *
 * BottomNav の FAB（+）で開くドロワーで、モバイル主動線の記録 UI。
 * BasePage を継承しない（独立したオーバーレイ UI のため）。
 *
 * 前提: BottomNav は md:hidden のため、モバイルビューポートで使用すること。
 */
export class QuickEntryPage {
    private readonly dialog: Locator

    constructor(private readonly page: Page) {
        // DrawerContent は role="dialog" として描画される
        this.dialog = page.getByRole('dialog')
    }

    /** ドロワーが開いて操作可能になるまで待機 */
    async waitForOpen(): Promise<void> {
        await expect(this.dialog.getByText('クイック記録')).toBeVisible()
    }

    /** 支出 / 収入 タブを切り替える（デフォルトは支出） */
    async selectBalanceType(type: '支出' | '収入'): Promise<void> {
        await this.dialog.getByRole('button', { name: type }).click()
    }

    /** テンキーで1桁ずつ入力する */
    async enterAmount(amount: number): Promise<void> {
        for (const digit of String(amount)) {
            await this.dialog.getByRole('button', { name: digit, exact: true }).click()
        }
    }

    /** カテゴリグリッドからカテゴリ名で選択する */
    async selectCategory(name: string): Promise<void> {
        // 折りたたみ表示の場合のみ「もっと見る」が表示されているので、それを基準に展開判定する。
        // 目的のカテゴリの可視性で判定すると、レンダリング遅延で false 検出 → 余計なクリックでタイムアウトを誘発する。
        const moreButton = this.dialog.getByRole('button', { name: /もっと見る/ })
        if (await moreButton.isVisible()) {
            await moreButton.click()
        }
        await this.dialog.getByRole('button', { name, exact: true }).click()
    }

    /** メモ（任意）フィールドに入力する */
    async fillMemo(memo: string): Promise<void> {
        await this.dialog.getByLabel('メモ').fill(memo)
    }

    /** 「記録する」ボタンをクリックして送信する */
    async submit(): Promise<void> {
        await this.dialog.getByRole('button', { name: '記録する' }).click()
    }

    /** 登録成功メッセージを検証する */
    async expectSuccess(): Promise<void> {
        await expect(this.dialog.getByText('登録しました')).toBeVisible({ timeout: 30000 })
    }
}
