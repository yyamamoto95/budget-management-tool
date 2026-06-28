import { test } from '@playwright/test'
import { SettingsPage } from './pages/SettingsPage'

/**
 * 設定保存フロー E2E テスト
 * auth.setup.ts で確立したログインセッションを再利用する。
 *
 * 検証する継ぎ目（seam）:
 *   UI 操作 → Server Action(saveSettingsAction) → API(PUT /settings) → DB → UI フィードバック
 * この経路はコンポーネント UT・API 統合テストのいずれもカバーしておらず、
 * 過去に「保存が静かに失敗する」不具合が発生した箇所。
 */

// 変更対象フィールド（AmountField の aria-label）
const FIELD = '月収（手取り）'

test.describe('設定の保存フロー', () => {
    let settings: SettingsPage
    let original: number

    test.beforeEach(async ({ page }) => {
        settings = new SettingsPage(page)
        await settings.goto()
        // 保存前の値を退避（テスト後に復元し、繰り返し実行で同結果になるようにする）
        original = await settings.readAmount(FIELD)
    })

    test.afterEach(async () => {
        // 変更を元の値へ戻して再現性を担保する
        await settings.setAmount(FIELD, original)
        await settings.save()
        await settings.expectSaveSucceeded()
    })

    test('設定値を変更して保存すると成功し、リロード後も永続化されている', async () => {
        // 元の値と必ず異なる決定的な値を用意する
        const next = original === 250000 ? 260000 : 250000

        // 確認: 保存前のフィールドに既存の設定値が表示されている
        await settings.expectAmount(FIELD, original)

        // 変更 → 保存 → 成功表示
        await settings.setAmount(FIELD, next)
        await settings.save()
        await settings.expectSaveSucceeded()

        // 永続化検証: リロードしても変更値が保持されている
        await settings.reload()
        await settings.expectAmount(FIELD, next)
    })
})
