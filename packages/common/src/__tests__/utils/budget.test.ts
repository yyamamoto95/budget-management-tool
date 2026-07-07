import { describe, it, expect } from 'vitest'
import { calcDailyBudget, calcDaysUntilPayday } from '../../utils/budget'

describe('calcDaysUntilPayday', () => {
    it('今日が給料日より前のとき、今月の給料日までの日数を返す', () => {
        const today = new Date(2026, 4, 20) // 5月20日
        expect(calcDaysUntilPayday(today, 25)).toBe(5) // 5/20 → 5/25
    })

    it('今日が給料日と同日のとき、来月の給料日までの日数を返す', () => {
        const today = new Date(2026, 4, 25) // 5月25日
        const result = calcDaysUntilPayday(today, 25)
        // 5/25 → 6/25 = 31日
        expect(result).toBe(31)
    })

    it('今日が給料日より後のとき、来月の給料日までの日数を返す', () => {
        const today = new Date(2026, 4, 28) // 5月28日
        const result = calcDaysUntilPayday(today, 25)
        // 5/28 → 6/25 = 28日
        expect(result).toBe(28)
    })

    it('月末を跨ぐ場合: 12月末から翌年1月給料日', () => {
        const today = new Date(2026, 11, 31) // 12月31日
        const result = calcDaysUntilPayday(today, 25)
        // 12/31 → 1/25 = 25日
        expect(result).toBe(25)
    })

    it('給料日が月末より大きい場合（例: 31日指定で2月）、月末の日付に丸める', () => {
        const today = new Date(2026, 0, 15) // 1月15日
        // 1月31日 → 16日
        expect(calcDaysUntilPayday(today, 31)).toBe(16)
    })

    it('最低1日を保証する（today=paydayDay=1月1日）', () => {
        const today = new Date(2026, 0, 1)
        // 1/1に給料日が1の場合 → 来月2/1 = 31日
        expect(calcDaysUntilPayday(today, 1)).toBeGreaterThanOrEqual(1)
    })
})

describe('calcDailyBudget', () => {
    const today = new Date(2026, 4, 20) // 5月20日

    it('正常系: 可処分残高 / 給料日までの日数 を返す', () => {
        const result = calcDailyBudget({
            totalAssets: 300000,
            fixedExpenses: 100000,
            paydayDay: 25,
            today,
        })
        // availableBalance = 300000 - 100000 = 200000
        // daysUntilPayday = 5
        // dailyBudget = floor(200000 / 5) = 40000
        expect(result.availableBalance).toBe(200000)
        expect(result.daysUntilPayday).toBe(5)
        expect(result.dailyBudget).toBe(40000)
    })

    it('貯蓄目標があるとき、可処分残高から控除して日割りする（#457）', () => {
        const result = calcDailyBudget({
            totalAssets: 300000,
            fixedExpenses: 100000,
            paydayDay: 25,
            savingsGoal: 50000,
            today,
        })
        // availableBalance = 300000 - 100000 - 50000 = 150000
        // dailyBudget = floor(150000 / 5) = 30000
        expect(result.availableBalance).toBe(150000)
        expect(result.dailyBudget).toBe(30000)
    })

    it('貯蓄目標の控除で可処分残高が負になるとき、dailyBudget=0 を返す（#457）', () => {
        const result = calcDailyBudget({
            totalAssets: 120000,
            fixedExpenses: 100000,
            paydayDay: 25,
            savingsGoal: 50000,
            today,
        })
        expect(result.availableBalance).toBe(-30000)
        expect(result.dailyBudget).toBe(0)
    })

    it('貯蓄目標を省略したとき、従来どおり控除なしで計算する（後方互換）', () => {
        const withoutGoal = calcDailyBudget({
            totalAssets: 300000,
            fixedExpenses: 100000,
            paydayDay: 25,
            today,
        })
        const withZeroGoal = calcDailyBudget({
            totalAssets: 300000,
            fixedExpenses: 100000,
            paydayDay: 25,
            savingsGoal: 0,
            today,
        })
        expect(withoutGoal).toEqual(withZeroGoal)
    })

    it('可処分残高が0のとき、dailyBudget=0 を返す', () => {
        const result = calcDailyBudget({
            totalAssets: 100000,
            fixedExpenses: 100000,
            paydayDay: 25,
            today,
        })
        expect(result.availableBalance).toBe(0)
        expect(result.dailyBudget).toBe(0)
    })

    it('可処分残高が負のとき、dailyBudget=0 を返す', () => {
        const result = calcDailyBudget({
            totalAssets: 50000,
            fixedExpenses: 100000,
            paydayDay: 25,
            today,
        })
        expect(result.availableBalance).toBe(-50000)
        expect(result.dailyBudget).toBe(0)
    })

    it('固定費が0のとき、totalAssets 全額を日割りする', () => {
        const result = calcDailyBudget({
            totalAssets: 150000,
            fixedExpenses: 0,
            paydayDay: 25,
            today,
        })
        expect(result.dailyBudget).toBe(Math.floor(150000 / 5)) // 30000
    })

    it('端数は切り捨て', () => {
        const result = calcDailyBudget({
            totalAssets: 100001,
            fixedExpenses: 0,
            paydayDay: 25,
            today,
        })
        // 100001 / 5 = 20000.2 → floor → 20000
        expect(result.dailyBudget).toBe(20000)
    })
})
