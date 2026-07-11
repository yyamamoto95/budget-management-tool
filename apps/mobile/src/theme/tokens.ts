/**
 * デザイントークン（Web と同一値）。
 * 値は pnpm sync:tokens が生成する tokens.generated.ts（globals.css ライトモード由来）を参照する。
 * CssVarName の keyof 型により、Web 側で変数が消えるとここが型エラーになり乖離を検知できる。
 * RN は CSS 変数・linear-gradient を使えないため、bar はグラデーションの主色を用いる。
 */
import type { BudgetTone, SavingsForecastState, SavingsInsightKind, SpendStatus } from '@budget/common';
import { cssVars, type CssVarName } from './tokens.generated';

function v(name: CssVarName): string {
  return cssVars[name];
}

export const colors = {
  background: v('--background'),
  surface: v('--color-surface-default'),
  foreground: v('--foreground'),
  borderDefault: v('--border-default'),

  brandPrimary: v('--color-brand-primary'),
  brandLight: v('--color-brand-light'),

  expense: v('--color-expense'),
  expenseLight: v('--color-expense-light'),
  income: v('--color-income'),
  incomeLight: v('--color-income-light'),
  caution: v('--color-caution'),
} as const;

/** カード全体の3トーン配色（--color-status-*） */
export const statusTone: Record<
  BudgetTone,
  { bg: string; border: string; hero: string; badge: string }
> = {
  safe: {
    bg: v('--color-status-safe-bg'),
    border: v('--color-status-safe-border'),
    hero: v('--color-status-safe-hero'),
    badge: v('--color-status-safe-badge'),
  },
  caution: {
    bg: v('--color-status-caution-bg'),
    border: v('--color-status-caution-border'),
    hero: v('--color-status-caution-hero'),
    badge: v('--color-status-caution-badge'),
  },
  danger: {
    bg: v('--color-status-danger-bg'),
    border: v('--color-status-danger-border'),
    hero: v('--color-status-danger-hero'),
    badge: v('--color-status-danger-badge'),
  },
};

/** forecast 系トークン（bar はグラデーションではなく主色 --color-forecast-* を使用） */
const forecast = {
  safe: {
    color: v('--color-forecast-safe'),
    badgeBg: v('--color-forecast-safe-badge-bg'),
    bar: v('--color-forecast-safe'),
  },
  caution: {
    color: v('--color-forecast-caution'),
    badgeBg: v('--color-forecast-caution-badge-bg'),
    bar: v('--color-forecast-caution'),
  },
  danger: {
    color: v('--color-forecast-danger'),
    badgeBg: v('--color-forecast-danger-badge-bg'),
    bar: v('--color-forecast-danger'),
  },
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

/** 貯蓄予測カードの4状態配色（Web SavingsForecastCard の STATE_TOKENS と同マッピング。#575）
 *  RN はグラデーション不可のため bar は主色を使う */
export const savingsForecastUi: Record<
  SavingsForecastState,
  { color: string; badgeBg: string; bar: string; barLight: string }
> = {
  excellent: {
    color: v('--color-forecast-excellent'),
    badgeBg: v('--color-forecast-excellent-badge-bg'),
    bar: v('--color-forecast-excellent'),
    barLight: v('--color-forecast-excellent-bar-light'),
  },
  safe: {
    color: v('--color-forecast-safe'),
    badgeBg: v('--color-forecast-safe-badge-bg'),
    bar: v('--color-forecast-safe'),
    barLight: v('--color-forecast-safe-bar-light'),
  },
  caution: {
    color: v('--color-forecast-caution'),
    badgeBg: v('--color-forecast-caution-badge-bg'),
    bar: v('--color-forecast-caution'),
    barLight: v('--color-forecast-caution-bar-light'),
  },
  danger: {
    color: v('--color-forecast-danger'),
    badgeBg: v('--color-forecast-danger-badge-bg'),
    bar: v('--color-forecast-danger'),
    barLight: v('--color-forecast-danger-bar-light'),
  },
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
