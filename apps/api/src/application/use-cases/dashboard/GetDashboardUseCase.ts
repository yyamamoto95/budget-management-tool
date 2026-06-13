import { calcDailyBudget } from '@budget/common';
import type { Expense } from '../../../domain/models/Expense';
import type { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import type { IUserSettingsRepository } from '../../../domain/repositories/IUserSettingsRepository';

/** ダッシュボード集約レスポンス */
export type DashboardResult = {
    todayExpense: number;
    dailyBudget: { amount: number; remaining: number; ratio: number; daysUntilPayday: number } | null;
    monthSummary: { expense: number; income: number };
    lastMonthExpense: number;
    weeklyRecord: Array<{ date: string; dow: string; expense: number; recorded: boolean }>;
    recentExpenses: Expense[];
    streak: number;
};

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function toDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export class GetDashboardUseCase {
    constructor(
        private readonly expenseRepository: IExpenseRepository,
        private readonly userSettingsRepository: IUserSettingsRepository
    ) {}

    async execute(userId: string): Promise<DashboardResult> {
        const [expenses, settings] = await Promise.all([
            this.expenseRepository.findByUserId(userId),
            this.userSettingsRepository.findByUserId(userId),
        ]);

        const today = new Date();
        const todayStr = toDateString(today);
        const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        // 先月
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

        // 支出のみ（balanceType=0, 未削除）
        const outgoExpenses = expenses.filter((e) => e.balanceType === 0);
        const incomeExpenses = expenses.filter((e) => e.balanceType === 1);

        // 今日の支出
        const todayExpense = outgoExpenses.filter((e) => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);

        // 今月の収支
        const monthExpense = outgoExpenses
            .filter((e) => e.date.startsWith(thisMonth))
            .reduce((sum, e) => sum + e.amount, 0);
        const monthIncome = incomeExpenses
            .filter((e) => e.date.startsWith(thisMonth))
            .reduce((sum, e) => sum + e.amount, 0);

        // 先月の支出
        const lastMonthExpense = outgoExpenses
            .filter((e) => e.date.startsWith(lastMonth))
            .reduce((sum, e) => sum + e.amount, 0);

        // 1日予算
        let dailyBudget: DashboardResult['dailyBudget'] = null;
        if (settings?.initialSetupCompleted) {
            const result = calcDailyBudget({
                totalAssets: settings.totalAssets,
                fixedExpenses: settings.fixedExpenses,
                paydayDay: settings.paydayDay,
                today,
            });
            const remaining = result.dailyBudget - todayExpense;
            const ratio = result.dailyBudget > 0 ? remaining / result.dailyBudget : 0;
            dailyBudget = {
                amount: result.dailyBudget,
                remaining,
                ratio,
                daysUntilPayday: result.daysUntilPayday,
            };
        }

        // 週間記録（過去7日）
        const weeklyRecord: DashboardResult['weeklyRecord'] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const dateStr = toDateString(d);
            const dayExpense = outgoExpenses.filter((e) => e.date === dateStr).reduce((sum, e) => sum + e.amount, 0);
            const hasRecord = expenses.some((e) => e.date === dateStr);
            weeklyRecord.push({
                date: dateStr,
                dow: DOW_LABELS[d.getDay()],
                expense: dayExpense,
                recorded: hasRecord,
            });
        }

        // 最新5件
        const recentExpenses = [...expenses]
            .sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime())
            .slice(0, 5);

        // 連続記録日数（今日から遡って記録がある日を数える）
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const dateStr = toDateString(d);
            if (expenses.some((e) => e.date === dateStr)) {
                streak++;
            } else {
                break;
            }
        }

        return {
            todayExpense,
            dailyBudget,
            monthSummary: { expense: monthExpense, income: monthIncome },
            lastMonthExpense,
            weeklyRecord,
            recentExpenses,
            streak,
        };
    }
}
