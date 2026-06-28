import { expect, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * 設定画面（/settings）の Page Object。
 *
 * 金額入力は AmountField の aria-label でアクセスする
 * （例: '月収（手取り）' / '口座残高' / '貯蓄目標' / 固定費の各項目名）。
 */
export class SettingsPage extends BasePage {
    protected readonly path = '/settings'

    /** 保存ボタン（保存中は文言が「保存中...」に変わるため name 指定で特定） */
    private get saveButton(): Locator {
        return this.page.getByRole('button', { name: '設定を保存する' })
    }

    /** 保存成功トースト */
    private get successToast(): Locator {
        return this.page.getByText('設定を保存しました')
    }

    protected async waitForReady(): Promise<void> {
        await expect(this.saveButton).toBeVisible()
    }

    /** ラベル（aria-label）で金額入力フィールドを取得する */
    private amountField(label: string): Locator {
        return this.page.getByRole('textbox', { name: label })
    }

    /** フィールドの現在値を数値で読み取る（"300,000" → 300000） */
    async readAmount(label: string): Promise<number> {
        const raw = await this.amountField(label).inputValue()
        return Number(raw.replace(/[^0-9]/g, ''))
    }

    /** フィールドへ金額を入力し、blur で確定する */
    async setAmount(label: string, value: number): Promise<void> {
        // AmountField はフォーカス有無で表示が "250,000"（カンマ付き）/ raw と切り替わる
        // 制御コンポーネントのため、全選択 → 削除 → 1 文字ずつ入力で確実に置き換える
        const field = this.amountField(label)
        await field.click()
        await field.press('ControlOrMeta+a')
        await field.press('Delete')
        await field.pressSequentially(String(value))
        await field.blur()
    }

    /** 保存ボタンを押す */
    async save(): Promise<void> {
        await this.saveButton.click()
    }

    /** 保存成功（トースト表示）を検証する */
    async expectSaveSucceeded(): Promise<void> {
        await expect(this.successToast).toBeVisible({ timeout: 10000 })
    }

    /** フィールドが指定値であることを検証する */
    async expectAmount(label: string, value: number): Promise<void> {
        await expect.poll(() => this.readAmount(label)).toBe(value)
    }
}
