/** 1日予算の算出結果 */
export type DailyBudgetResult = {
    /** 1日あたりの使える金額（円）。可処分残高が0以下の場合は0 */
    dailyBudget: number;
    /** 次の給料日まで何日あるか */
    daysUntilPayday: number;
    /** 固定費・貯蓄目標を差し引いた可処分残高（円） */
    availableBalance: number;
};

/**
 * 給料日までの残日数を計算する。
 * 今日が給料日以降の場合は来月の給料日を返す。
 *
 * @param today - 基準日
 * @param paydayDay - 給料日（1〜31）
 */
export function calcDaysUntilPayday(today: Date, paydayDay: number): number {
    const todayDate = today.getDate();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth(); // 0-indexed

    let nextPayday: Date;
    if (todayDate < paydayDay) {
        // 今月の給料日がまだ来ていない
        const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
        const clampedDay = Math.min(paydayDay, daysInMonth);
        nextPayday = new Date(todayYear, todayMonth, clampedDay);
    } else {
        // 今月の給料日は過ぎたので来月
        const nextMonth = todayMonth + 1;
        const nextMonthYear = nextMonth > 11 ? todayYear + 1 : todayYear;
        const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
        const daysInNextMonth = new Date(nextMonthYear, nextMonthIndex + 1, 0).getDate();
        const clampedDay = Math.min(paydayDay, daysInNextMonth);
        nextPayday = new Date(nextMonthYear, nextMonthIndex, clampedDay);
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const todayNoon = new Date(todayYear, todayMonth, todayDate);
    const diff = Math.round((nextPayday.getTime() - todayNoon.getTime()) / msPerDay);
    // 最低1日は確保（0除算防止）
    return Math.max(diff, 1);
}

/**
 * 1日あたりの使える金額（1日予算）を算出する。
 * 「給料日まで固定費・貯蓄目標を引いた残高でどれだけ使えるか」の計算。
 *
 * @param params.totalAssets - 現在の総資産（円）
 * @param params.fixedExpenses - 今月残りの固定費合計（円）
 * @param params.paydayDay - 給料日（1〜31）
 * @param params.today - 基準日
 * @param params.savingsGoal - 月間貯蓄目標（円）。給料日まで確保する額として控除する（省略時 0）
 */
export function calcDailyBudget(params: {
    totalAssets: number;
    fixedExpenses: number;
    paydayDay: number;
    today: Date;
    savingsGoal?: number;
}): DailyBudgetResult {
    const { totalAssets, fixedExpenses, paydayDay, today, savingsGoal = 0 } = params;

    const daysUntilPayday = calcDaysUntilPayday(today, paydayDay);
    const availableBalance = totalAssets - fixedExpenses - savingsGoal;

    const dailyBudget = availableBalance > 0
        ? Math.floor(availableBalance / daysUntilPayday)
        : 0;

    return { dailyBudget, daysUntilPayday, availableBalance };
}
