/**
 * Xデー（資産枯渇日）算出ロジック
 * 算出式の根拠は本ファイルの JSDoc とテストが仕様（xday.test.ts）
 */

/** Xデー算出に必要な入力変数 */
export interface XDayInputs {
    /** A: 現在の総資産残高（円） */
    totalAssets: number;
    /** B: 直近30日の実績日次平均支出（円/日）。データ不足時は 0 */
    avgDailyExpense: number;
    /** C: 月次固定収入の最低保証値（円/月） */
    monthlyIncome: number;
    /** D: 同属性の統計的平均日次生活コスト（円/日） */
    statsDailyExpense: number;
    /** n: 記録済み日数（ユニーク日付の数） */
    recordedDays: number;
    /** 最後に資産スナップショットを更新した日時 */
    lastUpdatedAt: Date;
}

/** Xデー算出結果 */
export interface XDayResult {
    /** 資産枯渇予測日。null は収入 > 支出で枯渇しない（∞） */
    xDate: Date | null;
    /** 残存日数。null は ∞ */
    daysRemaining: number | null;
    /** 実効日次支出 E（信頼重みを適用済み） */
    effectiveDailyExpense: number;
    /** 純日次消費 E_net = max(E - C_d, 0) */
    netDailyExpense: number;
    /** 信頼重み W（0.0〜1.0）*/
    trustWeight: number;
    /** 1円あたりのXデー短縮時間（分） */
    minutesPerYen: number;
    /** リアルタイム資産残高（侵食カウント込み） */
    realtimeAssets: number;
}

/** 信頼重み W = min(n / 90, 1.0) */
export function calcTrustWeight(recordedDays: number): number {
    return Math.min(recordedDays / 90, 1.0);
}

/** 実効日次支出 E = W×B + (1-W)×D */
export function calcEffectiveDailyExpense(
    avgDailyExpense: number,
    statsDailyExpense: number,
    trustWeight: number,
): number {
    return trustWeight * avgDailyExpense + (1 - trustWeight) * statsDailyExpense;
}

/** 純日次消費 E_net = max(E - C/30, 0) */
export function calcNetDailyExpense(
    effectiveDailyExpense: number,
    monthlyIncome: number,
): number {
    const dailyIncome = monthlyIncome / 30;
    return Math.max(effectiveDailyExpense - dailyIncome, 0);
}

/** 1円あたりのXデー短縮時間（分） */
export function calcMinutesPerYen(netDailyExpense: number): number {
    if (netDailyExpense <= 0) return 0;
    return (1 / netDailyExpense) * 24 * 60;
}

/**
 * リアルタイム資産残高（侵食カウント込み）
 * lastUpdatedAt から now までの経過時間分だけ E_net で資産を減算する。
 */
export function calcRealtimeAssets(
    totalAssets: number,
    netDailyExpense: number,
    lastUpdatedAt: Date,
    now: Date = new Date(),
): number {
    if (netDailyExpense <= 0) return totalAssets;
    const elapsedSec = (now.getTime() - lastUpdatedAt.getTime()) / 1000;
    const virtualConsumed = netDailyExpense * (elapsedSec / 86400);
    return totalAssets - virtualConsumed;
}

/** Xデー算出メイン関数 */
export function calculateXDay(inputs: XDayInputs, now: Date = new Date()): XDayResult {
    const { totalAssets, avgDailyExpense, monthlyIncome, statsDailyExpense, recordedDays, lastUpdatedAt } = inputs;

    const trustWeight = calcTrustWeight(recordedDays);
    const effectiveDailyExpense = calcEffectiveDailyExpense(avgDailyExpense, statsDailyExpense, trustWeight);
    const netDailyExpense = calcNetDailyExpense(effectiveDailyExpense, monthlyIncome);
    const minutesPerYen = calcMinutesPerYen(netDailyExpense);
    const realtimeAssets = calcRealtimeAssets(totalAssets, netDailyExpense, lastUpdatedAt, now);

    if (netDailyExpense <= 0) {
        return { xDate: null, daysRemaining: null, effectiveDailyExpense, netDailyExpense, trustWeight, minutesPerYen: 0, realtimeAssets };
    }

    const daysRemaining = Math.floor(realtimeAssets / netDailyExpense);
    const xDate = new Date(now.getTime() + daysRemaining * 86400_000);

    return { xDate, daysRemaining, effectiveDailyExpense, netDailyExpense, trustWeight, minutesPerYen, realtimeAssets };
}

/**
 * 特定支出額がXデーを何時間/分引き寄せるかを計算。
 * 入力フォームの「確定前プレビュー」で使用する。
 */
export function calcExpenseImpact(
    amount: number,
    minutesPerYen: number,
): { totalMinutes: number; label: string } {
    const totalMinutes = amount * minutesPerYen;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes * 60) % 60);

    let label: string;
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainHours = hours % 24;
        label = remainHours > 0 ? `${days}日${remainHours}時間` : `${days}日`;
    } else if (hours > 0) {
        label = `${hours}時間${minutes}分`;
    } else if (minutes > 0) {
        label = `${minutes}分${seconds}秒`;
    } else {
        label = `${Math.round(totalMinutes * 60)}秒`;
    }

    return { totalMinutes, label };
}
