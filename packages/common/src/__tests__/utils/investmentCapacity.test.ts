import { describe, expect, it } from 'vitest'
import {
    buildInvestmentDeepLinkQuery,
    calculateInvestmentCapacity,
    emergencyFundDisplay,
    formatCapacityHoldReason,
    EMERGENCY_FUND_TARGET_MONTHS,
    INVESTMENT_RATIO_OF_SURPLUS,
} from '../../utils/investmentCapacity'

describe('calculateInvestmentCapacity', () => {
    // E_m = 8000 × 30 = 240,000 円/月 → 防衛資金目標 = 240,000 × 6 = 1,440,000 円
    const baseInputs = {
        totalAssets: 2_880_000, // 充足率 2.0（mid）
        avgDailyExpense: 8_000,
        monthlyIncome: 300_000, // 黒字 60,000 円/月
        recordedDays: 30,
    }

    it('防衛資金充足かつ黒字のとき、黒字の一部を投資可能額として返す', () => {
        const result = calculateInvestmentCapacity(baseInputs)
        expect(result.status).toBe('ok')
        if (result.status !== 'ok') return
        // 60,000 × 0.5 = 30,000 円（千円単位切り捨て）
        expect(result.monthlyLimitJpy).toBe(60_000 * INVESTMENT_RATIO_OF_SURPLUS)
        expect(result.emergencyFundTargetJpy).toBe(240_000 * EMERGENCY_FUND_TARGET_MONTHS)
        expect(result.emergencyFundRatio).toBeCloseTo(2.0, 5)
        expect(result.riskTolerance).toBe('mid')
        expect(result.shouldHold).toBe(false)
    })

    it('投資可能額は千円単位に切り捨てて控えめに提示する', () => {
        // 黒字 61,300 円 → × 0.5 = 30,650 → 30,000 円
        const result = calculateInvestmentCapacity({ ...baseInputs, monthlyIncome: 301_300 })
        if (result.status !== 'ok') throw new Error('ok を期待')
        expect(result.monthlyLimitJpy).toBe(30_000)
    })

    it('防衛資金が未充足のとき、黒字があっても投資可能額 0 円（投資を控える）を返す', () => {
        // 総資産 1,200,000 < 目標 1,440,000（充足率 ≈ 0.83）
        const result = calculateInvestmentCapacity({ ...baseInputs, totalAssets: 1_200_000 })
        if (result.status !== 'ok') throw new Error('ok を期待')
        expect(result.monthlyLimitJpy).toBe(0)
        expect(result.shouldHold).toBe(true)
        expect(result.riskTolerance).toBe('low')
        expect(result.emergencyFundRatio).toBeLessThan(1.0)
    })

    it('防衛資金は充足しているが月次赤字のとき、投資可能額 0 円（投資を控える）を返す', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, monthlyIncome: 200_000 })
        if (result.status !== 'ok') throw new Error('ok を期待')
        expect(result.monthlyLimitJpy).toBe(0)
        expect(result.shouldHold).toBe(true)
    })

    it('充足率がちょうど 1.0 のとき、投資を控えない（境界値）', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, totalAssets: 1_440_000 })
        if (result.status !== 'ok') throw new Error('ok を期待')
        expect(result.shouldHold).toBe(false)
        expect(result.riskTolerance).toBe('low')
    })

    it('充足率 3.0 以上のとき、リスク許容度 high を返す（境界値）', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, totalAssets: 4_320_000 })
        if (result.status !== 'ok') throw new Error('ok を期待')
        expect(result.riskTolerance).toBe('high')
    })

    it('総資産が未設定のとき、no-assets を返す（生活余力と同じガード）', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, totalAssets: null })
        expect(result.status).toBe('no-assets')
    })

    it('支出記録がないとき、no-expense-data を返す', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, avgDailyExpense: 0 })
        expect(result.status).toBe('no-expense-data')
    })

    it('記録日数が 7 日未満のとき、insufficient-data を返す', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, recordedDays: 6 })
        expect(result.status).toBe('insufficient-data')
    })
})

describe('buildInvestmentDeepLinkQuery', () => {
    const baseInputs = {
        totalAssets: 2_880_000,
        avgDailyExpense: 8_000,
        monthlyIncome: 300_000,
        recordedDays: 30,
    }

    it('投資可能額があるとき、PII を含まないクエリ文字列を返す', () => {
        const result = calculateInvestmentCapacity(baseInputs)
        const query = buildInvestmentDeepLinkQuery(result)
        expect(query).toBe('risk_tolerance=mid&monthly_limit=30000')
    })

    it('投資を控える判断のとき、null を返す（送客しない）', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, totalAssets: 1_000_000 })
        expect(buildInvestmentDeepLinkQuery(result)).toBeNull()
    })

    it('算出不能のとき、null を返す', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, totalAssets: null })
        expect(buildInvestmentDeepLinkQuery(result)).toBeNull()
    })
})

describe('formatCapacityHoldReason', () => {
    const baseInputs = {
        totalAssets: 2_880_000,
        avgDailyExpense: 8_000,
        monthlyIncome: 300_000,
        recordedDays: 30,
    }

    it('防衛資金未充足のとき、目標額と充足率を含む理由文を返す', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, totalAssets: 1_200_000 })
        // 目標 1,440,000 円・充足率 83%
        expect(formatCapacityHoldReason(result)).toBe(
            '生活の備え（目標 ¥1,440,000）が 83% です。まずは備えを整える段階です。'
        )
    })

    it('月次赤字のとき、家計の立て直しを優先する理由文を返す', () => {
        const result = calculateInvestmentCapacity({ ...baseInputs, monthlyIncome: 200_000 })
        expect(formatCapacityHoldReason(result)).toBe(
            '今月は支出が収入を上回るペースです。投資より家計の立て直しが先の段階です。'
        )
    })

    it('投資可能なとき・算出不能のとき、null を返す', () => {
        expect(formatCapacityHoldReason(calculateInvestmentCapacity(baseInputs))).toBeNull()
        expect(
            formatCapacityHoldReason(
                calculateInvestmentCapacity({ ...baseInputs, totalAssets: null })
            )
        ).toBeNull()
    })
})

describe('emergencyFundDisplay', () => {
    it('充足率をパーセント表示とバー幅（100 上限）に変換する', () => {
        expect(emergencyFundDisplay(2.0)).toEqual({ percent: 200, barPercent: 100 })
        expect(emergencyFundDisplay(0.83)).toEqual({ percent: 83, barPercent: 83 })
    })

    it('負の充足率（負債超過など）は 0 にクランプする', () => {
        expect(emergencyFundDisplay(-0.5)).toEqual({ percent: 0, barPercent: 0 })
    })
})
