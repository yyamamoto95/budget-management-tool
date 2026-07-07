/**
 * 生活余力（今の資産で生活費あと何ヶ月分か）の算出ロジック
 * 仕様: .github/spec/core-spec.md ①「アルゴリズム：生活余力」
 *
 * 旧称「Xデー（資産枯渇日付）」の算出（xday.ts）とは異なり、
 * 日付ではなく月数で示す肯定形の指標。リアルタイム減算は行わない。
 */

/** 統計データ基盤（同属性の平均日次生活コスト D）が未整備のため、信頼重み W は 1.0 固定（実績値のみ） */
const FIXED_TRUST_WEIGHT = 1.0;

/** 実績日次支出 B が安定するまでに必要な最低記録日数（spec ①「算出可否のガード」） */
export const MIN_RECORDED_DAYS_FOR_MARGIN = 7;

/** 月次換算に使う日数 */
const DAYS_PER_MONTH = 30;

/** 即時フィードバックで「ほぼ変わらない」と扱う日数のしきい値 */
const IMPACT_DAYS_THRESHOLD = 0.1;

export interface LivingMarginInputs {
    /** A: 現在の総資産残高（円）。初回設定未完了など未設定の場合は null */
    totalAssets: number | null;
    /** B: 直近30日の実績日次平均支出（円/日）。入力データが30日未満の場合は保有日数で除算した値 */
    avgDailyExpense: number;
    /** C: 月次固定収入の最低保証値（円/月） */
    monthlyIncome: number;
    /** n: 記録済み日数（ユニーク日付数） */
    recordedDays: number;
}

export type LivingMarginResult =
    | {
          status: 'ok';
          /** 生活余力（生活費◯ヶ月分）。表示時は小数1桁に丸める */
          reserveMonths: number;
          /** 実効日次支出 E（円/日） */
          effectiveDailyExpense: number;
          /** 月間実効支出 E_m（円/月） */
          monthlyEffectiveExpense: number;
          /** 純増減 net_monthly = C - E_m（円/月） */
          netMonthly: number;
          /** 月次増減（月数換算）。減少中は負値 */
          monthlyDeltaMonths: number;
          /** 余力が増加中か（net_monthly >= 0） */
          increasing: boolean;
      }
    /** 総資産 A が未設定 → カード非表示・設定への導線を表示 */
    | { status: 'no-assets' }
    /** E_m = 0（支出記録がない等）→「記録が溜まると表示されます」 */
    | { status: 'no-expense-data' }
    /** 記録日数 n < 7 → 実績 B が不安定なため算出しない */
    | { status: 'insufficient-data' };

/** 生活余力を算出する。算出不能の場合は理由を status で返す */
export function calculateLivingMargin(inputs: LivingMarginInputs): LivingMarginResult {
    const { totalAssets, avgDailyExpense, monthlyIncome, recordedDays } = inputs;

    if (totalAssets === null) {
        return { status: 'no-assets' };
    }

    const effectiveDailyExpense = FIXED_TRUST_WEIGHT * avgDailyExpense;
    const monthlyEffectiveExpense = effectiveDailyExpense * DAYS_PER_MONTH;

    if (monthlyEffectiveExpense <= 0) {
        return { status: 'no-expense-data' };
    }
    if (recordedDays < MIN_RECORDED_DAYS_FOR_MARGIN) {
        return { status: 'insufficient-data' };
    }

    const reserveMonths = totalAssets / monthlyEffectiveExpense;
    const netMonthly = monthlyIncome - monthlyEffectiveExpense;
    const monthlyDeltaMonths = netMonthly / monthlyEffectiveExpense;

    return {
        status: 'ok',
        reserveMonths,
        effectiveDailyExpense,
        monthlyEffectiveExpense,
        netMonthly,
        monthlyDeltaMonths,
        increasing: netMonthly >= 0,
    };
}

/**
 * 支出額が生活余力を何日分動かすかの即時フィードバック文言。
 * 事実の数字のみを提示し、恐怖・煽り表現は使わない（product.md トーン＆ボイス）。
 * 算出不能（E が不明）の場合は null を返し、呼び出し側は追記なしで表示する。
 */
export function formatLivingMarginImpact(
    amount: number,
    effectiveDailyExpense: number
): string | null {
    if (effectiveDailyExpense <= 0 || amount <= 0) {
        return null;
    }
    const days = amount / effectiveDailyExpense;
    if (days < IMPACT_DAYS_THRESHOLD) {
        return '生活余力はほぼ変わりません';
    }
    return `生活余力 −${days.toFixed(1)}日分`;
}
