import { expect, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export type ReportPeriod = 'week' | 'month' | 'lastMonth'

const PERIOD_LABELS: Record<ReportPeriod, string> = {
    week: '直近7日',
    month: '今月',
    lastMonth: '先月',
}

/**
 * レポート画面（/report）の Page Object。
 *
 * 期間切り替えはボタン式（combobox ではない）。
 * URL パラメータ: week / month / lastMonth（省略時は month）。
 */
export class ReportPage extends BasePage {
    protected readonly path = '/report'

    private periodButton(period: ReportPeriod): Locator {
        return this.page.getByRole('button', { name: PERIOD_LABELS[period] })
    }

    protected async waitForReady(): Promise<void> {
        await expect(this.periodButton('month')).toBeVisible()
    }

    /** 期間ボタンをクリックして切り替える */
    async selectPeriod(period: ReportPeriod): Promise<void> {
        await this.periodButton(period).click()
    }

    /** 全期間ボタンが表示されていることを検証 */
    async expectPeriodTabsVisible(): Promise<void> {
        for (const period of ['week', 'month', 'lastMonth'] as const) {
            await expect(this.periodButton(period)).toBeVisible()
        }
    }

    /** URL に period パラメータが含まれることを検証 */
    async expectUrlPeriod(period: ReportPeriod): Promise<void> {
        await expect(this.page).toHaveURL(new RegExp(`period=${period}`))
    }
}
