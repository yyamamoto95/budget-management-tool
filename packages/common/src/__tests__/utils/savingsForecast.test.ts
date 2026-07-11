import { describe, it, expect } from 'vitest'
import { calcSavingsForecast, savingsForecastBadgeLabel } from '../../utils/savingsForecast'

/**
 * サンドボックス HomePrototype Block 3 のモック値に基づく検証。
 * 収入 252,600 / 支出 148,700（うち今日 1,830）/ 目標 30,000 / 15日経過 / 31日
 */
const SANDBOX_CASE = {
    monthIncome: 252_600,
    monthExpense: 148_700,
    todayExpense: 1_830,
    savingsGoal: 30_000,
    dayOfMonth: 15,
    daysInMonth: 31,
}

describe('calcSavingsForecast', () => {
    it('サンドボックスのモック値で予測支出・予測残高が一致する', () => {
        const r = calcSavingsForecast(SANDBOX_CASE)
        // past = 148700 - 1830 = 146870, remainingDays = 16
        // projected = 146870 + 1830 * 17 = 177980
        expect(r.projectedMonthEndExpense).toBe(177_980)
        expect(r.projectedSavings).toBe(252_600 - 177_980) // 74,620
        expect(r.remainingDays).toBe(16)
        expect(r.remainingBudget).toBe(103_900)
        expect(r.dailyRemainingBudget).toBeCloseTo(103_900 / 16, 5)
    })

    it('達成率 ≥ 150% のとき excellent（超好調）', () => {
        const r = calcSavingsForecast(SANDBOX_CASE)
        // 74,620 / 30,000 = 2.487
        expect(r.achievementRate).toBeCloseTo(2.487, 2)
        expect(r.state).toBe('excellent')
    })

    it('達成率 100〜149% のとき safe（好調）', () => {
        const r = calcSavingsForecast({ ...SANDBOX_CASE, savingsGoal: 60_000 })
        // 74,620 / 60,000 = 1.24
        expect(r.state).toBe('safe')
    })

    it('達成率 50〜99% のとき caution（注意）', () => {
        const r = calcSavingsForecast({ ...SANDBOX_CASE, savingsGoal: 100_000 })
        // 74,620 / 100,000 = 0.75
        expect(r.state).toBe('caution')
    })

    it('達成率 < 50% のとき danger（危険）', () => {
        const r = calcSavingsForecast({ ...SANDBOX_CASE, savingsGoal: 200_000 })
        expect(r.state).toBe('danger')
    })

    it('予測残高が負（赤字見込み）のとき、目標達成率によらず danger', () => {
        const r = calcSavingsForecast({
            ...SANDBOX_CASE,
            todayExpense: 20_000,
            monthExpense: 250_000,
        })
        expect(r.projectedSavings).toBeLessThan(0)
        expect(r.state).toBe('danger')
    })

    it('目標未設定（0）のとき achievementRate / targetLinePct は null、黒字なら safe', () => {
        const r = calcSavingsForecast({ ...SANDBOX_CASE, savingsGoal: 0 })
        expect(r.achievementRate).toBeNull()
        expect(r.targetLinePct).toBeNull()
        expect(r.state).toBe('safe')
    })

    it('目標未設定かつ赤字見込みのときは danger', () => {
        const r = calcSavingsForecast({
            ...SANDBOX_CASE,
            savingsGoal: 0,
            monthExpense: 260_000,
            todayExpense: 0,
        })
        expect(r.state).toBe('danger')
    })

    it('収入が0のとき、比率系は0で予測残高は負になる', () => {
        const r = calcSavingsForecast({ ...SANDBOX_CASE, monthIncome: 0 })
        expect(r.actualExpensePct).toBe(0)
        expect(r.projectedExpensePct).toBe(0)
        expect(r.state).toBe('danger')
    })

    it('月末日（残り日数0）のとき、今日の支出のみ延長され1日の目安は0', () => {
        const r = calcSavingsForecast({ ...SANDBOX_CASE, dayOfMonth: 31 })
        expect(r.remainingDays).toBe(0)
        expect(r.projectedMonthEndExpense).toBe(148_700) // past + today*1
        expect(r.dailyRemainingBudget).toBe(0)
    })

    it('バー用の比率は99%でクランプされる', () => {
        const r = calcSavingsForecast({
            ...SANDBOX_CASE,
            monthExpense: 300_000,
            todayExpense: 0,
        })
        expect(r.actualExpensePct).toBe(99)
    })
})

describe('savingsForecastBadgeLabel', () => {
    const base = { state: 'safe' as const, achievementRate: 1.2, projectedSavings: 36000 }

    it('目標未設定・赤字見込みを最優先で表示する', () => {
        expect(savingsForecastBadgeLabel(base, 0)).toBe('目標未設定')
        expect(savingsForecastBadgeLabel({ ...base, projectedSavings: -5000 }, 30000)).toBe('赤字見込み')
    })

    it('4状態の文言を返す（Web SavingsForecastCard と同一）', () => {
        expect(
            savingsForecastBadgeLabel({ state: 'excellent', achievementRate: 2.49, projectedSavings: 74700 }, 30000)
        ).toBe('目標 +149% 達成見込み！')
        expect(savingsForecastBadgeLabel(base, 30000)).toBe('達成見込み ✓')
        expect(
            savingsForecastBadgeLabel({ state: 'caution', achievementRate: 0.7, projectedSavings: 21000 }, 30000)
        ).toBe('目標まであと¥9,000')
        expect(
            savingsForecastBadgeLabel({ state: 'danger', achievementRate: 0.2, projectedSavings: 6000 }, 30000)
        ).toBe('達成困難')
    })
})
