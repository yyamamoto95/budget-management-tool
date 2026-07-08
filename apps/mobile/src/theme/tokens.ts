/**
 * デザイントークン（Web と同一値）。
 * SSOT: .github/design/figma-tokens.json + apps/web/src/app/globals.css（ライトモード値）
 * RN は CSS 変数・linear-gradient を使えないため、単色フォールバックで保持する。
 */
import type { BudgetTone, SavingsInsightKind, SpendStatus } from '@budget/common';

export const colors = {
  background: '#faf6f2',
  surface: '#ffffff',
  foreground: '#1c1410',
  borderDefault: 'rgba(28,20,16,0.08)',

  brandPrimary: '#f18840',
  brandLight: '#fff6ee',

  expense: '#f18840',
  expenseLight: '#fff6ee',
  income: '#35b5a2',
  incomeLight: '#ecfaf8',
} as const;

/** カード全体の3トーン配色（globals.css --color-status-* と同値） */
export const statusTone: Record<
  BudgetTone,
  { bg: string; border: string; hero: string; badge: string }
> = {
  safe: {
    bg: '#f8faf8',
    border: 'rgba(196,181,165,0.5)',
    hero: '#6b5b52',
    badge: '#c4b5a5',
  },
  caution: {
    bg: '#fef4f4',
    border: 'rgba(248,113,113,0.35)',
    hero: '#b91c1c',
    badge: '#f87171',
  },
  danger: {
    bg: '#fff1f2',
    border: 'rgba(244,63,94,0.35)',
    hero: '#9f1239',
    badge: '#f43f5e',
  },
};

/** forecast 系トークン（globals.css --color-forecast-* と同値。bar はグラデーションの主色） */
const forecast = {
  safe: { color: '#35b5a2', badgeBg: 'rgba(53,181,162,0.10)', bar: '#35b5a2' },
  caution: { color: '#e879a3', badgeBg: 'rgba(232,121,163,0.12)', bar: '#e879a3' },
  danger: { color: '#f43f5e', badgeBg: 'rgba(244,63,94,0.09)', bar: '#f43f5e' },
} as const;

/** 4状態バッジ・進捗バーの配色（Web DailyBudgetHero の SPEND_STATUS_UI と同マッピング） */
export const spendStatusUi: Record<
  SpendStatus,
  { color: string; badgeBg: string; bar: string }
> = {
  great: forecast.safe,
  steady: forecast.safe,
  caution: forecast.caution,
  over: forecast.danger,
};

/** インサイト種別ごとの配色（Web DailyBudgetHero の INSIGHT_UI と同マッピング） */
export const insightUi: Record<SavingsInsightKind, { color: string; bg: string }> = {
  'over-no-goal': { color: forecast.danger.color, bg: forecast.danger.badgeBg },
  'within-no-goal': { color: forecast.safe.color, bg: forecast.safe.badgeBg },
  excellent: { color: colors.brandPrimary, bg: colors.brandLight },
  'on-track': { color: forecast.safe.color, bg: forecast.safe.badgeBg },
  almost: { color: forecast.caution.color, bg: forecast.caution.badgeBg },
  deficit: { color: forecast.danger.color, bg: forecast.danger.badgeBg },
  behind: { color: colors.brandPrimary, bg: colors.brandLight },
};
