import { describe, it, expect, vi, beforeEach } from 'vitest'

// next の副作用 import を遮断（saveUserSettingsAction が参照するため）
vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}))
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

vi.mock('@/lib/api/settings', () => ({
    putSettings: vi.fn(),
}))

import { saveSettingsAction } from '@/lib/actions/settings'
import { putSettings } from '@/lib/api/settings'
import type { UpsertUserSettingsBody, UserSettingsResponse } from '@budget/api-client'

// ─── saveSettingsAction ───────────────────────────────────────────
// 設定ページの保存ボタンから呼ばれる Server Action。
// putSettings の成否を { error, success } へ変換する責務だけを検証する
// （バリデーション・永続化は API 統合テストが担保するため二重検証しない）。

describe('saveSettingsAction', () => {
    const validData: UpsertUserSettingsBody = {
        totalAssets: 1000000,
        monthlyIncome: 300000,
        paydayDay: 25,
        fixedExpenses: 80000,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('正常系: putSettings が成功したとき success=true・error=null を返す', async () => {
        vi.mocked(putSettings).mockResolvedValue({} as UserSettingsResponse)

        const result = await saveSettingsAction(validData)

        expect(result).toEqual({ error: null, success: true })
        // 受け取ったデータをそのまま API へ渡すこと
        expect(putSettings).toHaveBeenCalledWith(validData)
        expect(putSettings).toHaveBeenCalledTimes(1)
    })

    it('異常系: putSettings が Error を投げたとき、そのメッセージを error に載せて success=false を返す', async () => {
        vi.mocked(putSettings).mockRejectedValue(new Error('保存に失敗しました'))

        const result = await saveSettingsAction(validData)

        expect(result).toEqual({ error: '保存に失敗しました', success: false })
    })

    it('異常系: Error 以外が投げられたとき、デフォルトメッセージで success=false を返す', async () => {
        vi.mocked(putSettings).mockRejectedValue('unexpected')

        const result = await saveSettingsAction(validData)

        expect(result).toEqual({ error: '保存に失敗しました', success: false })
    })
})
