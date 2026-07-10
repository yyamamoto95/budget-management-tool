import { describe, expect, it } from 'vitest'
import {
    AUTO_FIXED_DAY_DEFAULT,
    buildAutoFixedEntries,
    clampAutoFixedDay,
    autoFixedYearMonth,
    shouldRegisterAutoFixed,
} from '../../utils/autoFixedExpenses'

describe('clampAutoFixedDay', () => {
    it('1〜28 の範囲に丸める', () => {
        expect(clampAutoFixedDay(1)).toBe(1)
        expect(clampAutoFixedDay(28)).toBe(28)
        expect(clampAutoFixedDay(0)).toBe(1)
        expect(clampAutoFixedDay(31)).toBe(28)
    })

    it('整数でない値はデフォルトに落とす', () => {
        expect(clampAutoFixedDay(NaN)).toBe(AUTO_FIXED_DAY_DEFAULT)
        expect(clampAutoFixedDay(15.5)).toBe(AUTO_FIXED_DAY_DEFAULT)
    })
})

describe('shouldRegisterAutoFixed', () => {
    const today = new Date('2026-07-15T10:00:00+09:00')

    it('オフのときは常に false', () => {
        expect(shouldRegisterAutoFixed({ enabled: false, day: 1, today })).toBe(false)
    })

    it('登録日当日・経過後は true、前日までは false', () => {
        expect(shouldRegisterAutoFixed({ enabled: true, day: 15, today })).toBe(true)
        expect(shouldRegisterAutoFixed({ enabled: true, day: 10, today })).toBe(true)
        expect(shouldRegisterAutoFixed({ enabled: true, day: 16, today })).toBe(false)
    })
})

describe('buildAutoFixedEntries', () => {
    const today = new Date('2026-07-15T10:00:00+09:00')

    it('金額のある項目だけを、登録日の日付・カテゴリ・自動登録の目印つきで組み立てる', () => {
        const entries = buildAutoFixedEntries(
            { rent: 85000, utilities: 12000, insurance: 0, subscriptions: 5000 },
            { today, day: 27 }
        )
        expect(entries).toHaveLength(3)
        expect(entries[0]).toEqual({
            amount: 85000,
            balanceType: 0,
            categoryId: 5,
            content: '家賃（自動登録）',
            date: '2026-07-27',
        })
        expect(entries.map((e) => e.content)).toEqual([
            '家賃（自動登録）',
            '光熱費（自動登録）',
            'サブスク（自動登録）',
        ])
    })

    it('内訳が null・全項目 0 のときは空配列', () => {
        expect(buildAutoFixedEntries(null, { today, day: 27 })).toEqual([])
        expect(buildAutoFixedEntries({ rent: 0 }, { today, day: 27 })).toEqual([])
    })

    it('登録日は 1〜28 に丸めて日付化する', () => {
        const entries = buildAutoFixedEntries({ rent: 1000 }, { today, day: 31 })
        expect(entries[0].date).toBe('2026-07-28')
    })
})

describe('autoFixedYearMonth', () => {
    it('YYYY-MM 形式で返す', () => {
        expect(autoFixedYearMonth(new Date('2026-01-05T00:00:00+09:00'))).toBe('2026-01')
    })

    it('UTC では前日でも日本時間の日付で判定する', () => {
        // UTC 2026-06-30 16:00 = JST 2026-07-01 01:00
        const utcEdge = new Date('2026-06-30T16:00:00Z')
        expect(autoFixedYearMonth(utcEdge)).toBe('2026-07')
        expect(shouldRegisterAutoFixed({ enabled: true, day: 1, today: utcEdge })).toBe(true)
    })
})
