/**
 * 偏差値算出ロジック
 * ベース: 総務省「家計調査」2023年単身世帯データ（月次・円）
 * 仕様: .github/spec/core-spec.md「断罪UI」
 */

export type ExpenseCategory = 'food' | 'transport' | 'utilities' | 'entertainment' | 'medical' | 'other';

/** カテゴリ表示名 */
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    food:          '食費',
    transport:     '交通',
    utilities:     '光熱',
    entertainment: '娯楽',
    medical:       '医療',
    other:         '他',
};

/** 総務省統計データ（単身世帯・月次・円）*/
export const STATS_SINGLE_HOUSEHOLD: Record<ExpenseCategory, { mean: number; stddev: number }> = {
    food:          { mean: 43_000, stddev: 15_000 },
    transport:     { mean: 20_000, stddev: 8_000  },
    utilities:     { mean:  8_500, stddev: 2_500  },
    entertainment: { mean: 18_000, stddev: 9_000  },
    medical:       { mean:  7_500, stddev: 4_000  },
    other:         { mean: 25_000, stddev: 10_000 },
};

/** 統計平均日次生活コスト（単身世帯）≈ 4,067円/日 */
export const DEFAULT_STATS_DAILY_EXPENSE: number = Math.round(
    Object.values(STATS_SINGLE_HOUSEHOLD).reduce((sum, s) => sum + s.mean, 0) / 30
);

/** 偏差値レベル */
export type DeviationLevel = 'surplus' | 'normal' | 'caution' | 'danger';

/** 月次支出額から偏差値を算出（小数点以下切り捨て） */
export function calcDeviation(monthlyAmount: number, category: ExpenseCategory): number {
    const { mean, stddev } = STATS_SINGLE_HOUSEHOLD[category];
    return Math.round(50 + 10 * (monthlyAmount - mean) / stddev);
}

/** 偏差値からレベルを判定 */
export function getDeviationLevel(deviation: number): DeviationLevel {
    if (deviation < 40) return 'surplus';
    if (deviation < 60) return 'normal';
    if (deviation < 70) return 'caution';
    return 'danger';
}

/** 偏差値レベルから CSS カラー変数名を返す */
export function getDeviationColor(level: DeviationLevel): string {
    const map: Record<DeviationLevel, string> = {
        surplus: '#00FF00',
        normal:  '#FFFFFF',
        caution: '#FFFF00',
        danger:  '#FF0000',
    };
    return map[level];
}

/** カテゴリ別の分析結果 */
export interface CategoryAnalysis {
    category: ExpenseCategory;
    label: string;
    monthlyAmount: number;
    deviation: number;
    level: DeviationLevel;
    color: string;
    /** Xデーへの影響日数（正の値は短縮、負は延長） */
    xDayImpactDays: number;
}

/** カテゴリ別支出からXデーへの影響日数を算出 */
export function calcXDayImpactDays(
    monthlyAmount: number,
    category: ExpenseCategory,
    netDailyExpense: number,
): number {
    if (netDailyExpense <= 0) return 0;
    const statsMean = STATS_SINGLE_HOUSEHOLD[category].mean;
    const monthlyDiff = monthlyAmount - statsMean; // 統計より多く使った額
    return Math.round(monthlyDiff / netDailyExpense);
}
