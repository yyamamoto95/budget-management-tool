"use client";

import { motion } from "framer-motion";
import {
  Wallet, Sparkles, TrendingUp, AlertTriangle, AlertCircle,
  type LucideIcon,
} from "lucide-react";
import {
  budgetTone,
  buildSavingsInsight,
  calcSavingsForecast,
  spendStatusOf,
  SPEND_STATUS_LABEL,
  type SavingsInsightKind,
  type SpendStatus,
} from "@budget/common";
import { SPRING } from "@/lib/motion";

/** バッジ・進捗バーのカラー（great/steady=緑・caution=ピンク・over=赤。forecast トークンを共用） */
const SPEND_STATUS_UI: Record<
  SpendStatus,
  { label: string; color: string; badgeBg: string; bar: string }
> = {
  great: {
    label: SPEND_STATUS_LABEL.great,
    color: "var(--color-forecast-safe)",
    badgeBg: "var(--color-forecast-safe-badge-bg)",
    bar: "var(--color-forecast-safe-bar)",
  },
  steady: {
    label: SPEND_STATUS_LABEL.steady,
    color: "var(--color-forecast-safe)",
    badgeBg: "var(--color-forecast-safe-badge-bg)",
    bar: "var(--color-forecast-safe-bar)",
  },
  caution: {
    label: SPEND_STATUS_LABEL.caution,
    color: "var(--color-forecast-caution)",
    badgeBg: "var(--color-forecast-caution-badge-bg)",
    bar: "var(--color-forecast-caution-bar)",
  },
  over: {
    label: SPEND_STATUS_LABEL.over,
    color: "var(--color-forecast-danger)",
    badgeBg: "var(--color-forecast-danger-badge-bg)",
    bar: "var(--color-forecast-danger-bar)",
  },
};

/** インサイト種別ごとの表示（アイコン・配色）。文言と判定は common 側の単一実装 */
const INSIGHT_UI: Record<SavingsInsightKind, { Icon: LucideIcon; color: string; bg: string }> = {
  "over-no-goal": {
    Icon: AlertCircle,
    color: "var(--color-forecast-danger)",
    bg: "var(--color-forecast-danger-badge-bg)",
  },
  "within-no-goal": {
    Icon: TrendingUp,
    color: "var(--color-forecast-safe)",
    bg: "var(--color-forecast-safe-badge-bg)",
  },
  excellent: {
    Icon: Sparkles,
    color: "var(--color-brand-primary)",
    bg: "var(--color-brand-light)",
  },
  "on-track": {
    Icon: TrendingUp,
    color: "var(--color-forecast-safe)",
    bg: "var(--color-forecast-safe-badge-bg)",
  },
  almost: {
    Icon: AlertTriangle,
    color: "var(--color-forecast-caution)",
    bg: "var(--color-forecast-caution-badge-bg)",
  },
  deficit: {
    Icon: AlertCircle,
    color: "var(--color-forecast-danger)",
    bg: "var(--color-forecast-danger-badge-bg)",
  },
  behind: {
    Icon: AlertCircle,
    color: "var(--color-brand-primary)",
    bg: "var(--color-brand-light)",
  },
};

type Props = {
  dailyBudget: {
    amount: number;
    remaining: number;
    ratio: number;
    daysUntilPayday: number;
  } | null;
  todayExpense: number;
  /** 今月の収支（貯蓄インサイトの月末予測に使用） */
  monthSummary: { expense: number; income: number };
  /** 月間貯蓄目標（円）。未設定は 0（インサイトが消化率ベースに縮退） */
  savingsGoal: number;
  /** 基準日。Storybook / VRT / テストで決定論的にレンダリングするための注入口（既定: 現在日時） */
  today?: Date;
};

export function DailyBudgetHero({
  dailyBudget,
  todayExpense,
  monthSummary,
  savingsGoal,
  today,
}: Props) {
  if (!dailyBudget) {
    return (
      <div
        className="rounded-2xl border-2 border-dashed p-6 text-center"
        style={{ borderColor: "var(--border-default)", color: "var(--foreground)" }}
      >
        <Wallet size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm font-bold">設定を完了すると1日予算が表示されます</p>
      </div>
    );
  }

  const tone = budgetTone(dailyBudget.ratio);

  // 日予算消化率 → 4状態バッジ + 進捗バー（#459）
  const spendPct = dailyBudget.amount > 0 ? todayExpense / dailyBudget.amount : 0;
  const spendStatus = spendStatusOf(spendPct);
  const statusUi = SPEND_STATUS_UI[spendStatus];

  // 貯蓄インサイト（月末予測は #458 と同じ共有ロジック）
  const now = today ?? new Date();
  const forecast = calcSavingsForecast({
    monthIncome: monthSummary.income,
    monthExpense: monthSummary.expense,
    todayExpense,
    savingsGoal,
    dayOfMonth: now.getDate(),
    daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  });
  const insight = buildSavingsInsight({
    spendStatus,
    savingsGoal,
    achievementRate: forecast.achievementRate,
    projectedSavings: forecast.projectedSavings,
  });
  const insightUi = INSIGHT_UI[insight.kind];

  return (
    <motion.div
      className="overflow-hidden rounded-2xl p-5"
      style={{
        background: `var(--color-status-${tone}-bg)`,
        border: `1.5px solid var(--color-status-${tone}-border)`,
        boxShadow: `0 0 24px var(--color-status-${tone}-glow)`,
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "var(--foreground)", opacity: 0.5 }}>
          今日使えるお金
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
          style={{ background: statusUi.badgeBg, color: statusUi.color }}
        >
          {statusUi.label}
        </span>
      </div>

      <div
        className="text-3xl font-extrabold tabular-nums lg:text-4xl"
        style={{ color: `var(--color-status-${tone}-hero)` }}
      >
        &yen;{dailyBudget.remaining.toLocaleString()}
      </div>

      {/* 今日の支出 / 日予算 の進捗バー（#459） */}
      <div
        className="mt-3 mb-1.5 flex justify-between text-[11px]"
        style={{ color: "var(--foreground)", opacity: 0.55 }}
      >
        <span>今日の支出</span>
        <span className="font-semibold tabular-nums">
          &yen;{todayExpense.toLocaleString()} / &yen;{dailyBudget.amount.toLocaleString()}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full"
        style={{ background: "rgba(28,20,16,0.06)" }}
        role="img"
        aria-label={`日予算の消化率 ${Math.round(spendPct * 100)}%`}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.round(spendPct * 100))}%` }}
          transition={{ ...SPRING.smooth, delay: 0.3 }}
          style={{ background: statusUi.bar }}
        />
      </div>

      {/* 貯蓄インサイト（#459） */}
      <div
        className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ background: insightUi.bg }}
      >
        <insightUi.Icon size={13} style={{ color: insightUi.color, flexShrink: 0 }} aria-hidden />
        <span
          className="text-[11px] font-semibold leading-tight"
          style={{ color: insightUi.color }}
        >
          {insight.message}
        </span>
      </div>

      <div className="mt-2 text-[11px] font-medium" style={{ color: "var(--foreground)", opacity: 0.4 }}>
        給料日まであと {dailyBudget.daysUntilPayday} 日
      </div>
    </motion.div>
  );
}
