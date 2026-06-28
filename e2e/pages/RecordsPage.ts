import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

type Period = 'week' | 'month' | 'lastMonth' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
    week: '直近7日',
    month: '今月',
    lastMonth: '先月',
    all: '全期間',
}

/**
 * 明細画面（/records）の Page Object。
 *
 * 期間フィルタ切り替え・検索・登録内容の確認に使用する。
 */
export class RecordsPage extends BasePage {
    protected readonly path = '/records'

    protected async waitForReady(): Promise<void> {
        // サマリーカードの「支出合計」が描画されるまで待機
        await expect(this.page.getByText('支出合計')).toBeVisible({ timeout: 15000 })
    }

    /**
     * 期間フィルタボタンを切り替える。
     * PeriodFilter コンポーネントのラベルに対応する。
     */
    async selectPeriod(period: Period): Promise<void> {
        await this.page.getByRole('button', { name: PERIOD_LABELS[period] }).click()
    }

    /**
     * 検索バーにキーワードを入力する。
     * SearchBar のプレースホルダーで特定し、入力後にルーターが /records?search=... へ遷移する。
     */
    async searchFor(text: string): Promise<void> {
        const input = this.page.getByPlaceholder('メモ・カテゴリで検索')
        await input.fill(text)
        // router.push による遷移 + Server Component 再フェッチを待機
        await this.page.waitForURL(`**/records?**search=**`, { timeout: 10000 })
    }

    /**
     * メモやカテゴリ名で絞り込んだ状態で明細ページを開く。
     * 全期間 + 検索クエリで表示するため、登録直後の確認に適している。
     */
    async gotoWithSearch(text: string): Promise<void> {
        const qs = new URLSearchParams({ period: 'all', search: text }).toString()
        await this.page.goto(`/records?${qs}`)
        await this.waitForReady()
    }

    /** 一覧に指定テキスト（メモ等）が表示されているか検証する */
    async expectEntryVisible(text: string): Promise<void> {
        await expect(this.page.getByText(text)).toBeVisible({ timeout: 10000 })
    }
}
