import { expect, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * ログイン画面（/login）の Page Object。
 */
export class LoginPage extends BasePage {
    protected readonly path = '/login'

    private get userIdInput(): Locator {
        return this.page.getByLabel('ユーザー名')
    }

    private get passwordInput(): Locator {
        return this.page.getByLabel('パスワード')
    }

    private get submitButton(): Locator {
        return this.page.getByRole('button', { name: 'ログインする' })
    }

    private get guestLoginButton(): Locator {
        return this.page.getByRole('button', { name: 'ゲストユーザーでログイン' })
    }

    protected async waitForReady(): Promise<void> {
        await expect(this.submitButton).toBeVisible()
    }

    /** ログインフォームを送信する */
    async submit(): Promise<void> {
        await this.submitButton.click()
    }

    /** userId のみ入力してサブミット（パスワード空のバリデーション確認用） */
    async fillUserIdOnly(userId: string): Promise<void> {
        await this.userIdInput.fill(userId)
    }

    /** password のみ入力してサブミット（userId 空のバリデーション確認用） */
    async fillPasswordOnly(password: string): Promise<void> {
        await this.passwordInput.fill(password)
    }

    /** 両フィールドに入力してサブミット */
    async login(userId: string, password: string): Promise<void> {
        await this.userIdInput.fill(userId)
        await this.passwordInput.fill(password)
        await this.submit()
    }

    /** userId フィールドがフォーカスされていることを検証（HTML5 required バリデーション） */
    async expectUserIdFocused(): Promise<void> {
        await expect(this.userIdInput).toBeFocused()
    }

    /** password フィールドがフォーカスされていることを検証（HTML5 required バリデーション） */
    async expectPasswordFocused(): Promise<void> {
        await expect(this.passwordInput).toBeFocused()
    }
}
