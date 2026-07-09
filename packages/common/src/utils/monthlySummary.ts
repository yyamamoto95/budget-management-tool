/**
 * 月次サマリーの派生値（Web / モバイル共通）
 * Web MonthlySummaryCard.tsx の計算式を単一実装化したもの。
 */

/** 貯蓄率（%）: (収入 − 支出) / 収入。収入 0 以下は 0 */
export function calcSavingsRate(income: number, expense: number): number {
    if (income <= 0) return 0;
    return Math.round(((income - expense) / income) * 100);
}

export interface MonthPaceResult {
    /** 先月比（%）: 日割り平均の増減。マイナス = 節約ペース */
    momPct: number;
    /** 月換算の節約額（円）。マイナス = 増加ペース */
    monthlySavedAmount: number;
}

/**
 * 先月比ペースを日割り平均で算出する。
 * 先月データがない・0 以下の場合は null。
 * 先月の日数は Web 実装と同じく 30 日固定で近似する。
 */
export function calcMonthPace(
    monthExpense: number,
    dayOfMonth: number,
    lastMonthExpense: number | null
): MonthPaceResult | null {
    if (lastMonthExpense === null || lastMonthExpense <= 0) return null;
    const lastMonthDailyAvg = lastMonthExpense / 30;
    const thisMonthDailyAvg = monthExpense / Math.max(1, dayOfMonth);
    return {
        momPct: Math.round((thisMonthDailyAvg / lastMonthDailyAvg - 1) * 100),
        monthlySavedAmount: Math.round((lastMonthDailyAvg - thisMonthDailyAvg) * 30),
    };
}
