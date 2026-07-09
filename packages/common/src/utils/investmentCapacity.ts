/**
 * 投資余力診断（今月投資に回してよい上限とリスク許容度）の算出ロジック
 * 仕様: .github/spec/investment-business-basics.md「MVP スコープ 1: 投資余力診断」
 * 連携契約: investment-analysis-tool の InvestmentCapacity
 * （同ツールの .github/PRD/synergy-with-budget-management-tool.md が契約の SSOT）
 *
 * 生活余力（livingMargin.ts）と同じ入力から算出する純粋関数。
 * 「今月は投資を控える」も正しい結果として返す（投資判断を急かさない）。
 */

import { calculateLivingMargin, type LivingMarginInputs } from './livingMargin';

/** 生活防衛資金の目標（生活費の月数）。初期仮設定（一般的な目安の 6 ヶ月分） */
export const EMERGENCY_FUND_TARGET_MONTHS = 6;

/** 月次黒字のうち投資余力に回す比率。残りは現金貯蓄に残す。初期仮設定 */
export const INVESTMENT_RATIO_OF_SURPLUS = 0.5;

/**
 * リスク許容度の閾値（生活防衛資金充足率）。初期仮設定
 * 充足率が目標の 2 倍以上で mid、3 倍以上で high（それ未満は low）
 */
export const RISK_TOLERANCE_THRESHOLDS = { mid: 2.0, high: 3.0 } as const;

/** 投資可能額の丸め単位（円）。端数を切り捨てて控えめに提示する */
const MONTHLY_LIMIT_ROUNDING_JPY = 1000;

/** 家計状態から導出するリスク許容度（連携契約 InvestmentCapacity.risk_tolerance と同値） */
export type RiskTolerance = 'low' | 'mid' | 'high';

export type InvestmentCapacityResult =
    | {
          status: 'ok';
          /** 今月投資に回してよい上限（円）。0 =「今月は投資を控える」 */
          monthlyLimitJpy: number;
          /** 家計状態から導出したリスク許容度 */
          riskTolerance: RiskTolerance;
          /** 生活防衛資金の充足率（1.0 = 充足） */
          emergencyFundRatio: number;
          /** 生活防衛資金の目標額（円）= 月間実効支出 × 目標月数 */
          emergencyFundTargetJpy: number;
          /** 今月は投資を控える判断か（防衛資金未充足 or 月次黒字なし） */
          shouldHold: boolean;
      }
    /** 生活余力と同じ算出可否ガード（livingMargin.ts 参照） */
    | { status: 'no-assets' }
    | { status: 'no-expense-data' }
    | { status: 'insufficient-data' };

/** 生活防衛資金の充足率からリスク許容度を導出する */
function deriveRiskTolerance(emergencyFundRatio: number): RiskTolerance {
    if (emergencyFundRatio >= RISK_TOLERANCE_THRESHOLDS.high) {
        return 'high';
    }
    if (emergencyFundRatio >= RISK_TOLERANCE_THRESHOLDS.mid) {
        return 'mid';
    }
    return 'low';
}

/**
 * 投資余力を診断する。算出不能の場合は理由を status で返す。
 * 生活防衛資金が未充足の場合、投資可能額 0 円（今月は投資を控える）を正しい結果として返す。
 */
export function calculateInvestmentCapacity(
    inputs: LivingMarginInputs
): InvestmentCapacityResult {
    const margin = calculateLivingMargin(inputs);
    if (margin.status !== 'ok') {
        return { status: margin.status };
    }

    // livingMargin の status が ok の時点で totalAssets は非 null（no-assets ガード済み）
    const totalAssets = inputs.totalAssets ?? 0;
    const emergencyFundTargetJpy = margin.monthlyEffectiveExpense * EMERGENCY_FUND_TARGET_MONTHS;
    const emergencyFundRatio = totalAssets / emergencyFundTargetJpy;

    // 防衛資金未充足: 黒字があってもまず現金の備えを優先する（投資を控える）
    if (emergencyFundRatio < 1.0) {
        return {
            status: 'ok',
            monthlyLimitJpy: 0,
            riskTolerance: 'low',
            emergencyFundRatio,
            emergencyFundTargetJpy,
            shouldHold: true,
        };
    }

    const investableSurplus = Math.max(0, margin.netMonthly) * INVESTMENT_RATIO_OF_SURPLUS;
    const monthlyLimitJpy =
        Math.floor(investableSurplus / MONTHLY_LIMIT_ROUNDING_JPY) * MONTHLY_LIMIT_ROUNDING_JPY;

    return {
        status: 'ok',
        monthlyLimitJpy,
        riskTolerance: deriveRiskTolerance(emergencyFundRatio),
        emergencyFundRatio,
        emergencyFundTargetJpy,
        shouldHold: monthlyLimitJpy <= 0,
    };
}

/**
 * investment-analysis-tool へのディープリンク用クエリ文字列を組み立てる
 * （Phase 1.75。PII・認証情報は含めない）。
 * 投資を控える判断のときは送客しない（null を返す）。
 */
export function buildInvestmentDeepLinkQuery(
    result: InvestmentCapacityResult
): string | null {
    if (result.status !== 'ok' || result.shouldHold) {
        return null;
    }
    // 値は列挙型と整数のみのため URL エンコード不要（DOM 非依存のまま組み立てる）
    return `risk_tolerance=${result.riskTolerance}&monthly_limit=${result.monthlyLimitJpy}`;
}
