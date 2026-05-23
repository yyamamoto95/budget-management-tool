import {
    calcDeviation,
    getDeviationLevel,
    getDeviationColor,
    calcXDayImpactDays,
    CATEGORY_LABELS,
    type ExpenseCategory,
    type CategoryAnalysis,
} from '@budget/common';
import type { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';

/** categoryId → ExpenseCategory のマッピング（固定6カテゴリ） */
const CATEGORY_MAP: Record<number, ExpenseCategory> = {
    1: 'food',
    2: 'transport',
    3: 'utilities',
    4: 'entertainment',
    5: 'medical',
    6: 'other',
};

export interface GetExpenditureAnalysisOutput {
    /** 対象月（YYYY-MM） */
    month: string;
    categories: CategoryAnalysis[];
    /** 全カテゴリ合計の偏差値 */
    totalDeviation: number;
    /** 全カテゴリ合計金額（円） */
    totalMonthlyAmount: number;
}

export class GetExpenditureAnalysisUseCase {
    constructor(private readonly expenseRepository: IExpenseRepository) {}

    async execute(userId: string, netDailyExpense: number): Promise<GetExpenditureAnalysisOutput> {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

        const allExpenses = await this.expenseRepository.findByUserId(userId);

        // 今月の支出のみ抽出（balanceType=0: 支出）
        const monthlyExpenses = allExpenses.filter((e) => {
            if (e.balanceType !== 0) return false;
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        // カテゴリ別月次合計を集計
        const totals = new Map<ExpenseCategory, number>();
        for (const cat of Object.values(CATEGORY_MAP)) {
            totals.set(cat, 0);
        }
        for (const expense of monthlyExpenses) {
            const cat = CATEGORY_MAP[expense.categoryId] ?? 'other';
            totals.set(cat, (totals.get(cat) ?? 0) + expense.amount);
        }

        const categories: CategoryAnalysis[] = (Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => {
            const monthlyAmount = totals.get(cat) ?? 0;
            const deviation = calcDeviation(monthlyAmount, cat);
            const level = getDeviationLevel(deviation);
            const color = getDeviationColor(level);
            const xDayImpactDays = calcXDayImpactDays(monthlyAmount, cat, netDailyExpense);
            return {
                category: cat,
                label: CATEGORY_LABELS[cat],
                monthlyAmount,
                deviation,
                level,
                color,
                xDayImpactDays,
            };
        });

        const totalMonthlyAmount = categories.reduce((s, c) => s + c.monthlyAmount, 0);
        const avgDeviation = Math.round(categories.reduce((s, c) => s + c.deviation, 0) / categories.length);

        return {
            month: monthStr,
            categories,
            totalDeviation: avgDeviation,
            totalMonthlyAmount,
        };
    }
}
