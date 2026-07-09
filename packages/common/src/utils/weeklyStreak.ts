/**
 * 週間ストリーク（今週の記録）の状態判定（Web / モバイル共通）
 * Web WeeklyStreak.tsx の判定ロジックを単一実装化したもの。
 */

export interface WeeklyStreakDay {
    /** YYYY-MM-DD */
    date: string;
    expense: number;
    recorded: boolean;
}

export type WeeklyStreakState = 'achieved' | 'over' | 'unrecorded' | 'future';

/**
 * 1日分の状態を判定する。
 * - date > todayStr → future（未来日）
 * - 記録あり × 日予算内 → achieved / 超過 → over
 * - 記録なし → unrecorded
 * dailyBudget が null（算出不能）の場合は 0 として扱う（Web と同一）。
 */
export function weeklyStreakStateOf(
    day: WeeklyStreakDay,
    dailyBudget: number | null,
    todayStr: string
): WeeklyStreakState {
    if (day.date > todayStr) return 'future';
    const budget = dailyBudget ?? 0;
    if (day.recorded) return day.expense <= budget ? 'achieved' : 'over';
    return 'unrecorded';
}

/** ヘッダー表示用の集計（達成日数 / 記録日数） */
export function countWeeklyAchievement(
    weeklyRecord: WeeklyStreakDay[],
    dailyBudget: number | null
): { achieved: number; recorded: number } {
    const budget = dailyBudget ?? 0;
    return {
        achieved: weeklyRecord.filter((d) => d.recorded && d.expense <= budget).length,
        recorded: weeklyRecord.filter((d) => d.recorded).length,
    };
}
