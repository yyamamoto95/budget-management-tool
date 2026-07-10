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

/** リスク許容度の表示ラベル（Web / モバイル共通。表記ゆれ防止のため common が SSOT） */
export const RISK_TOLERANCE_LABELS: Record<RiskTolerance, string> = {
    low: '低（安定重視）',
    mid: '中（バランス）',
    high: '高（変動を許容）',
};

/** 投資余力カードの表示文言（Web / モバイル共通 SSOT。断定・煽り表現を使わない） */
export const INVESTMENT_CAPACITY_TEXT = {
    title: '投資余力',
    limitLabel: '今月の上限',
    holdTitle: '今月は投資を控える月',
    fundLabel: `生活の備え（生活費 ${EMERGENCY_FUND_TARGET_MONTHS} ヶ月分が目安）`,
    ctaLabel: 'この条件で戦略の過去検証を見る',
    disclaimer:
        '診断は家計の記録に基づく目安であり、投資成果を保証するものではありません。' +
        '投資判断はご自身の責任で行ってください。',
} as const;

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
 * 「投資を控える月」の理由文（事実のみのトーン。Web / モバイル共通 SSOT）。
 * 控える判断でない場合は null を返す。
 */
export function formatCapacityHoldReason(
    result: InvestmentCapacityResult
): string | null {
    if (result.status !== 'ok' || !result.shouldHold) {
        return null;
    }
    if (result.emergencyFundRatio < 1.0) {
        const target = `¥${Math.round(result.emergencyFundTargetJpy).toLocaleString('ja-JP')}`;
        const percent = Math.max(0, Math.round(result.emergencyFundRatio * 100));
        return `生活の備え（目標 ${target}）が ${percent}% です。まずは備えを整える段階です。`;
    }
    return '今月は支出が収入を上回るペースです。投資より家計の立て直しが先の段階です。';
}

/**
 * 生活防衛資金の充足バー表示値（Web / モバイル共通）。
 * 負の総資産などで充足率が負になっても表示が壊れないよう 0 以上にクランプする。
 */
export function emergencyFundDisplay(emergencyFundRatio: number): {
    /** 表示用パーセント（0 以上・整数） */
    percent: number;
    /** バー幅パーセント（0〜100） */
    barPercent: number;
} {
    const percent = Math.max(0, Math.round(emergencyFundRatio * 100));
    return { percent, barPercent: Math.min(percent, 100) };
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

/**
 * 検証ツールへの CTA URL を組み立てる（Web / モバイル共通）。
 * ベース URL が未設定・http(s) 以外（相対パス等の設定ミス）、または送客しない診断結果の
 * 場合は null を返し、呼び出し側は CTA を表示しない。
 */
export function buildInvestmentToolCtaUrl(
    baseUrl: string | undefined,
    result: InvestmentCapacityResult
): string | null {
    if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
        return null;
    }
    const query = buildInvestmentDeepLinkQuery(result);
    if (query === null) {
        return null;
    }
    return `${baseUrl.replace(/\/$/, '')}/?${query}`;
}
