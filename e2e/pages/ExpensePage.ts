import { expect, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * 収支記録フォーム（/expenses/new）の Page Object。
 *
 * - 金額: label「金額（円）」の input
 * - 日付: label「日付」の date input
 * - 種別: 「支出」「収入」タブボタン（デフォルト：支出）
 * - 備考: 「備考（任意）」ボタンでアコーディオンを開き、placeholder で取得
 * - 送信: 「追加する」ボタン
 */
export class ExpensePage extends BasePage {
    protected readonly path = '/expenses/new'

    private get amountInput(): Locator {
        return this.page.getByLabel('金額（円）')
    }

    private get dateInput(): Locator {
        return this.page.getByLabel('日付')
    }

    private get submitButton(): Locator {
        return this.page.getByRole('button', { name: '追加する' })
    }

    private get memoToggleButton(): Locator {
        return this.page.getByRole('button', { name: /備考（任意）/ })
    }

    private get memoInput(): Locator {
        return this.page.getByPlaceholder('例: スーパーで食材')
    }

    protected async waitForReady(): Promise<void> {
        await expect(this.submitButton).toBeVisible()
    }

    /** 種別を切り替える（デフォルトは支出） */
    async selectBalanceType(type: '支出' | '収入'): Promise<void> {
        await this.page.getByRole('button', { name: type }).click()
    }

    /** 金額を入力する */
    async fillAmount(amount: string): Promise<void> {
        await this.amountInput.fill(amount)
    }

    /** 日付を入力する */
    async fillDate(date: string): Promise<void> {
        await this.dateInput.fill(date)
    }

    /** 備考アコーディオンを開いてメモを入力する */
    async fillMemo(memo: string): Promise<void> {
        await this.memoToggleButton.click()
        await this.memoInput.fill(memo)
    }

    /** フォームを送信する */
    async submit(): Promise<void> {
        await this.submitButton.click()
    }

    /** 登録成功メッセージを検証する */
    async expectSaveSucceeded(): Promise<void> {
        await expect(this.page.getByText('登録しました')).toBeVisible({ timeout: 30000 })
    }

    /** 金額フィールドがフォーカスされていることを検証（HTML5 required バリデーション） */
    async expectAmountFocused(): Promise<void> {
        await expect(this.amountInput).toBeFocused()
    }
}
