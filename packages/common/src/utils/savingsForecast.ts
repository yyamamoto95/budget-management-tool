import { formatYen } from './format';
/**
 * 今月の貯蓄予測（spec: サンドボックス HomePrototype Block 3 / #458）
 *
 * 「今日のペースで残り日数を延長する」A案で月末支出を予測し、
 * 貯蓄目標に対する達成見込みを4状態で評価する。
 * 状態のカラー閾値は SavingsForecastPalettePrototype に準拠する。
 */

/** 貯蓄予測の4状態（超好調 / 好調 / 注意 / 危険） */
export type SavingsForecastState = 'excellent' | 'safe' | 'caution' | 'danger';

export interface SavingsForecastInputs {
    /** 今月の収入合計（円） */
    monthIncome: number;
    /** 今月の支出合計（円・今日の支出を含む） */
    monthExpense: number;
    /** 今日の支出合計（円） */
    todayExpense: number;
    /** 月間貯蓄目標（円）。0 以下は「目標未設定」として扱う */
    savingsGoal: number;
    /** 今日が月の何日目か（1〜31） */
    dayOfMonth: number;
    /** 今月の日数（28〜31） */
    daysInMonth: number;
}

export interface SavingsForecastResult {
    /** 月末の予測支出（円）= 過去支出 + 今日の支出 ×（残り日数+1） */
    projectedMonthEndExpense: number;
    /** 月末の予測残高（円）= 収入 − 予測支出。負なら赤字見込み */
    projectedSavings: number;
    /** 貯蓄目標に対する達成率（1.0 = 100%）。目標未設定時は null */
    achievementRate: number | null;
    /** 4状態評価 */
    state: SavingsForecastState;
    /** 今月の残り予算（円）= 収入 − 支出 */
    remainingBudget: number;
    /** 今月の残り日数 */
    remainingDays: number;
    /** 1日の目安（円）= 残り予算 / 残り日数 */
    dailyRemainingBudget: number;
    /** 実支出の対収入比（%・0〜99） */
    actualExpensePct: number;
    /** 予測支出の対収入比（%・0〜99） */
    projectedExpensePct: number;
    /** 目標支出ライン（収入 − 貯蓄目標）の対収入比（%）。目標未設定時は null */
    targetLinePct: number | null;
}

/** 4状態の達成率閾値（SavingsForecastPalettePrototype 準拠） */
export const FORECAST_THRESHOLDS = {
    /** 超好調: 達成率 ≥ 150% */
    excellent: 1.5,
    /** 好調: 達成率 ≥ 100% */
    safe: 1.0,
    /** 注意: 達成率 ≥ 50%（未満は危険） */
    caution: 0.5,
} as const;

function toPct(value: number, income: number): number {
    if (income <= 0) return 0;
    return Math.min(99, Math.max(0, (value / income) * 100));
}

export function calcSavingsForecast(inputs: SavingsForecastInputs): SavingsForecastResult {
    const { monthIncome, monthExpense, todayExpense, savingsGoal, dayOfMonth, daysInMonth } = inputs;

    const pastExpense = monthExpense - todayExpense;
    const remainingDays = Math.max(0, daysInMonth - dayOfMonth);
    const projectedMonthEndExpense = pastExpense + todayExpense * (remainingDays + 1);
    const projectedSavings = monthIncome - projectedMonthEndExpense;

    const hasGoal = savingsGoal > 0;
    const achievementRate = hasGoal ? projectedSavings / savingsGoal : null;

    let state: SavingsForecastState;
    if (projectedSavings < 0) {
        state = 'danger';
    } else if (!hasGoal) {
        state = 'safe';
    } else if (achievementRate !== null && achievementRate >= FORECAST_THRESHOLDS.excellent) {
        state = 'excellent';
    } else if (achievementRate !== null && achievementRate >= FORECAST_THRESHOLDS.safe) {
        state = 'safe';
    } else if (achievementRate !== null && achievementRate >= FORECAST_THRESHOLDS.caution) {
        state = 'caution';
    } else {
        state = 'danger';
    }

    const remainingBudget = monthIncome - monthExpense;
    const dailyRemainingBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;

    return {
        projectedMonthEndExpense,
        projectedSavings,
        achievementRate,
        state,
        remainingBudget,
        remainingDays,
        dailyRemainingBudget,
        actualExpensePct: toPct(monthExpense, monthIncome),
        projectedExpensePct: toPct(projectedMonthEndExpense, monthIncome),
        targetLinePct: hasGoal ? toPct(monthIncome - savingsGoal, monthIncome) : null,
    };
}

/**
 * 状態バッジの文言（Web / モバイル共通 SSOT）。
 * 事実のみのトーン（煽らない・断定しない）を保つ。
 */
export function savingsForecastBadgeLabel(
    forecast: Pick<SavingsForecastResult, 'state' | 'achievementRate' | 'projectedSavings'>,
    savingsGoal: number
): string {
    if (savingsGoal <= 0) return '目標未設定';
    if (forecast.projectedSavings < 0) return '赤字見込み';
    switch (forecast.state) {
        case 'excellent':
            return `目標 +${Math.round(((forecast.achievementRate ?? 0) - 1) * 100)}% 達成見込み！`;
        case 'safe':
            return '達成見込み ✓';
        case 'caution':
            return `目標まであと${formatYen(savingsGoal - forecast.projectedSavings)}`;
        default:
            return '達成困難';
    }
}
