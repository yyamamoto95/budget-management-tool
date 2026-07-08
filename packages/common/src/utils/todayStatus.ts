/**
 * 「今日の状況」の状態判定ロジック（Web DailyBudgetHero / モバイル ホームで共有）
 * 仕様: TodayStatusPalettePrototype 準拠（#459）。
 * 表示（色・アイコン）はプラットフォーム側が kind / status をキーに解決する。
 */

/** 残予算比率による3トーン（カード全体の配色キー） */
export type BudgetTone = 'safe' | 'caution' | 'danger';

export function budgetTone(ratio: number): BudgetTone {
    if (ratio >= 0.8) return 'safe';
    if (ratio >= 0.2) return 'caution';
    return 'danger';
}

/** 日予算消化率による4状態バッジ */
export type SpendStatus = 'great' | 'steady' | 'caution' | 'over';

/** 4状態の消化率しきい値 */
export const SPEND_STATUS_THRESHOLDS = {
    /** 好調: 消化率 ≤ 50% */
    great: 0.5,
    /** 順調: 消化率 ≤ 80% */
    steady: 0.8,
    /** 注意: 消化率 ≤ 100%（超えると超過） */
    caution: 1.0,
} as const;

export function spendStatusOf(spendPct: number): SpendStatus {
    if (spendPct <= SPEND_STATUS_THRESHOLDS.great) return 'great';
    if (spendPct <= SPEND_STATUS_THRESHOLDS.steady) return 'steady';
    if (spendPct <= SPEND_STATUS_THRESHOLDS.caution) return 'caution';
    return 'over';
}

/** バッジの表示ラベル */
export const SPEND_STATUS_LABEL: Record<SpendStatus, string> = {
    great: '好調',
    steady: '順調',
    caution: '注意',
    over: '超過',
};

/** インサイトの種別（プラットフォーム側でアイコン・配色にマッピングする） */
export type SavingsInsightKind =
    | 'over-no-goal'
    | 'within-no-goal'
    | 'excellent'
    | 'on-track'
    | 'almost'
    | 'deficit'
    | 'behind';

export interface SavingsInsight {
    kind: SavingsInsightKind;
    message: string;
}

/**
 * 貯蓄インサイト1行メッセージ（サンドボックス savingsInsight 準拠）。
 * 目標未設定時は消化率ベースの文言に縮退する。
 */
export function buildSavingsInsight(params: {
    spendStatus: SpendStatus;
    savingsGoal: number;
    achievementRate: number | null;
    projectedSavings: number;
}): SavingsInsight {
    const { spendStatus, savingsGoal, achievementRate, projectedSavings } = params;

    if (savingsGoal <= 0) {
        return spendStatus === 'over'
            ? { kind: 'over-no-goal', message: '今日は日予算を超えています' }
            : { kind: 'within-no-goal', message: '今日は予算内に収まっています' };
    }

    if (achievementRate !== null && achievementRate >= 1.5) {
        return {
            kind: 'excellent',
            message: `今日この調子なら目標 +${Math.round((achievementRate - 1) * 100)}% 達成見込み！`,
        };
    }
    if (achievementRate !== null && achievementRate >= 1.0) {
        return { kind: 'on-track', message: 'このペースなら今月の貯蓄目標達成見込み' };
    }
    if (achievementRate !== null && achievementRate >= 0.5) {
        return { kind: 'almost', message: 'あと少し節約すると目標達成できそう' };
    }
    if (projectedSavings < 0) {
        return { kind: 'deficit', message: 'このペースだと今月赤字になりそう' };
    }
    return { kind: 'behind', message: '支出を抑えると目標に近づきます' };
}
