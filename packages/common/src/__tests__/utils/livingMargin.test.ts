import { describe, expect, it } from 'vitest'
import {
    calculateLivingMargin,
    formatLivingMarginImpact,
    MIN_RECORDED_DAYS_FOR_MARGIN,
} from '../../utils/livingMargin'

describe('calculateLivingMargin', () => {
    const baseInputs = {
        totalAssets: 960_000,
        avgDailyExpense: 8_000,
        monthlyIncome: 250_000,
        recordedDays: 30,
    }

    it('総資産と実績支出があるとき、生活余力（月数）を算出する', () => {
        const result = calculateLivingMargin(baseInputs)
        expect(result.status).toBe('ok')
        if (result.status !== 'ok') return
        // E = 8000, E_m = 240000, reserve = 960000 / 240000 = 4.0ヶ月分
        expect(result.reserveMonths).toBeCloseTo(4.0, 5)
        expect(result.effectiveDailyExpense).toBe(8_000)
        expect(result.monthlyEffectiveExpense).toBe(240_000)
    })

    it('収入が実効支出以上のとき、increasing が true になる', () => {
        const result = calculateLivingMargin(baseInputs)
        if (result.status !== 'ok') throw new Error('ok を期待')
        // net_monthly = 250000 - 240000 = 10000 >= 0
        expect(result.increasing).toBe(true)
        expect(result.netMonthly).toBe(10_000)
    })

    it('収入が実効支出を下回るとき、月次減少ペース（月数換算）を負値で返す', () => {
        const result = calculateLivingMargin({ ...baseInputs, monthlyIncome: 120_000 })
        if (result.status !== 'ok') throw new Error('ok を期待')
        // net_monthly = -120000, delta = -120000 / 240000 = -0.5ヶ月分/月
        expect(result.increasing).toBe(false)
        expect(result.monthlyDeltaMonths).toBeCloseTo(-0.5, 5)
    })

    it('総資産が未設定（null）のとき、no-assets を返す', () => {
        const result = calculateLivingMargin({ ...baseInputs, totalAssets: null })
        expect(result.status).toBe('no-assets')
    })

    it('実効支出がゼロ（記録なし）のとき、no-expense-data を返しゼロ除算しない', () => {
        const result = calculateLivingMargin({ ...baseInputs, avgDailyExpense: 0 })
        expect(result.status).toBe('no-expense-data')
    })

    it('記録日数が閾値未満のとき、insufficient-data を返す', () => {
        const result = calculateLivingMargin({
            ...baseInputs,
            recordedDays: MIN_RECORDED_DAYS_FOR_MARGIN - 1,
        })
        expect(result.status).toBe('insufficient-data')
    })

    it('記録日数がちょうど閾値のとき、算出する（境界値）', () => {
        const result = calculateLivingMargin({
            ...baseInputs,
            recordedDays: MIN_RECORDED_DAYS_FOR_MARGIN,
        })
        expect(result.status).toBe('ok')
    })

    it('総資産がゼロ（設定済み）のとき、余力 0 として算出する（未設定とは区別）', () => {
        const result = calculateLivingMargin({ ...baseInputs, totalAssets: 0 })
        if (result.status !== 'ok') throw new Error('ok を期待')
        expect(result.reserveMonths).toBe(0)
    })
})

describe('formatLivingMarginImpact', () => {
    it('支出が日次実効支出に対して大きいとき、日数換算のラベルを返す', () => {
        // 4000円 / 8000円/日 = 0.5日分
        expect(formatLivingMarginImpact(4_000, 8_000)).toBe('生活余力 −0.5日分')
    })

    it('支出の影響が 0.1 日未満のとき、「ほぼ変わりません」を返す', () => {
        // 500円 / 8000円/日 = 0.0625日
        expect(formatLivingMarginImpact(500, 8_000)).toBe('生活余力はほぼ変わりません')
    })

    it('実効支出が不明（0以下）のとき、null を返す', () => {
        expect(formatLivingMarginImpact(1_000, 0)).toBeNull()
    })

    it('金額が 0 以下のとき、null を返す', () => {
        expect(formatLivingMarginImpact(0, 8_000)).toBeNull()
    })
})
