/**
 * レポート集計ロジック（Web ReportClient / モバイル レポート画面で共有）
 * 支出・収入の合計、収支、先月比、カテゴリ別集計を純粋関数として提供する。
 */

export interface ReportExpenseItem {
    amount: number;
    /** 0=支出, 1=収入 */
    balanceType: number;
    categoryId: number;
}

export interface ReportCategoryInfo {
    id: number;
    name: string;
    color: string;
    /** 0=支出, 1=収入 */
    balanceType: number;
}

export interface ReportTotals {
    totalExpense: number;
    totalIncome: number;
    /** 収支 = 収入 − 支出 */
    balance: number;
}

/** 期間内の支出・収入合計と収支を集計する */
export function summarizeReportTotals(expenses: ReportExpenseItem[]): ReportTotals {
    const totalExpense = expenses
        .filter((e) => e.balanceType === 0)
        .reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = expenses
        .filter((e) => e.balanceType === 1)
        .reduce((sum, e) => sum + e.amount, 0);

    return { totalExpense, totalIncome, balance: totalIncome - totalExpense };
}

/** 先月比（%）。先月データがない・0 の場合は null */
export function calcVsLastMonthPct(totalExpense: number, lastMonthExpense: number | null): number | null {
    if (lastMonthExpense === null || lastMonthExpense <= 0) return null;
    return Math.round((totalExpense / lastMonthExpense) * 100);
}

export interface CategoryBreakdownItem {
    label: string;
    amount: number;
    color: string;
}

/** 支出のカテゴリ別集計（金額降順）。未知のカテゴリは「未分類」 */
export function aggregateExpensesByCategory(
    expenses: ReportExpenseItem[],
    categories: ReportCategoryInfo[]
): CategoryBreakdownItem[] {
    const outgos = expenses.filter((e) => e.balanceType === 0);
    if (outgos.length === 0) return [];

    const map = new Map<number, number>();
    for (const e of outgos) {
        map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount);
    }

    return [...map.entries()]
        .map(([id, amount]) => {
            const cat = categories.find((c) => c.balanceType === 0 && c.id === id);
            return {
                label: cat?.name ?? '未分類',
                amount,
                color: cat?.color ?? '#999',
            };
        })
        .sort((a, b) => b.amount - a.amount);
}
