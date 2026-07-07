"use client";

import { motion } from "framer-motion";
import { calcSavingsForecast, type SavingsForecastState } from "@budget/common";
import { SPRING } from "@/lib/motion";

type Props = {
  monthSummary: { expense: number; income: number };
  todayExpense: number;
  /** 月間貯蓄目標（円）。未設定は 0 */
  savingsGoal: number;
};

function formatYen(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString("ja-JP");
  return `${n < 0 ? "−" : ""}¥${abs}`;
}

/** 4状態のカラー（globals.css のセマンティックトークン / #458） */
const STATE_TOKENS: Record<
  SavingsForecastState,
  { color: string; badgeBg: string; bar: string; barLight: string }
> = {
  excellent: {
    color: "var(--color-forecast-excellent)",
    badgeBg: "var(--color-forecast-excellent-badge-bg)",
    bar: "var(--color-forecast-excellent-bar)",
    barLight: "var(--color-forecast-excellent-bar-light)",
  },
  safe: {
    color: "var(--color-forecast-safe)",
    badgeBg: "var(--color-forecast-safe-badge-bg)",
    bar: "var(--color-forecast-safe-bar)",
    barLight: "var(--color-forecast-safe-bar-light)",
  },
  caution: {
    color: "var(--color-forecast-caution)",
    badgeBg: "var(--color-forecast-caution-badge-bg)",
    bar: "var(--color-forecast-caution-bar)",
    barLight: "var(--color-forecast-caution-bar-light)",
  },
  danger: {
    color: "var(--color-forecast-danger)",
    badgeBg: "var(--color-forecast-danger-badge-bg)",
    bar: "var(--color-forecast-danger-bar)",
    barLight: "var(--color-forecast-danger-bar-light)",
  },
};

/** 状態バッジの文言（SavingsForecastPalettePrototype 準拠） */
function badgeLabel(params: {
  state: SavingsForecastState;
  achievementRate: number | null;
  projectedSavings: number;
  savingsGoal: number;
}): string {
  const { state, achievementRate, projectedSavings, savingsGoal } = params;
  if (savingsGoal <= 0) return "目標未設定";
  if (projectedSavings < 0) return "赤字見込み";
  switch (state) {
    case "excellent":
      return `目標 +${Math.round(((achievementRate ?? 0) - 1) * 100)}% 達成見込み！`;
    case "safe":
      return "達成見込み ✓";
    case "caution":
      return `目標まであと${formatYen(savingsGoal - projectedSavings)}`;
    default:
      return "達成困難";
  }
}

/**
 * 今月の貯蓄予測カード（サンドボックス HomePrototype Block 3 準拠 / #458）
 * 今日のペースで残り日数を延長した月末予測残高・目標到達バッジ・
 * 実支出+予測支出の二層バー・3指標フッターを表示する。
 */
export function SavingsForecastCard({ monthSummary, todayExpense, savingsGoal }: Props) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const forecast = calcSavingsForecast({
    monthIncome: monthSummary.income,
    monthExpense: monthSummary.expense,
    todayExpense,
    savingsGoal,
    dayOfMonth,
    daysInMonth,
  });
  const tokens = STATE_TOKENS[forecast.state];
  const label = badgeLabel({
    state: forecast.state,
    achievementRate: forecast.achievementRate,
    projectedSavings: forecast.projectedSavings,
    savingsGoal,
  });

  const stats = [
    {
      label: "残り予算",
      value: formatYen(forecast.remainingBudget),
      color: forecast.remainingBudget >= 0 ? "var(--foreground)" : "var(--color-forecast-danger)",
    },
    { label: "残り日数", value: `あと${forecast.remainingDays}日`, color: "var(--foreground)" },
    {
      label: "1日の目安",
      value: formatYen(Math.max(0, forecast.dailyRemainingBudget)),
      color:
        forecast.dailyRemainingBudget >= 0 ? "var(--foreground)" : "var(--color-forecast-danger)",
    },
  ];

  return (
    <motion.div
      data-testid="savings-forecast-card"
      className="overflow-hidden rounded-2xl border p-4"
      style={{
        background: "var(--color-surface-default)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
    >
      {/* ヘッダー + 状態バッジ */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
          今月の貯蓄予測
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: tokens.badgeBg, color: tokens.color }}
        >
          {label}
        </span>
      </div>

      {/* 月末予測残高 */}
      <div className="mb-0.5 text-[10px] font-semibold" style={{ color: "var(--foreground)", opacity: 0.42 }}>
        月末予測残高
      </div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <span
          className="text-3xl font-black tabular-nums"
          style={{
            color:
              forecast.projectedSavings >= 0
                ? "var(--color-income)"
                : "var(--color-forecast-danger)",
            letterSpacing: "-0.03em",
          }}
        >
          {forecast.projectedSavings >= 0 ? "+" : "−"}
          {formatYen(Math.abs(forecast.projectedSavings))}
        </span>
        <span className="text-[11px] font-semibold" style={{ color: "var(--foreground)", opacity: 0.42 }}>
          {forecast.projectedSavings >= 0 ? "貯まる見込み" : "不足見込み"}
        </span>
      </div>

      {/* 使用額 / 目標貯蓄 */}
      <div
        className="mb-1 flex justify-between text-[10px]"
        style={{ color: "var(--foreground)", opacity: 0.42 }}
      >
        <span>{formatYen(monthSummary.expense)} 使用</span>
        <span>{savingsGoal > 0 ? `目標貯蓄 ${formatYen(savingsGoal)}` : "目標貯蓄 未設定"}</span>
      </div>

      {/* 実支出（実色）+ 予測支出（淡色）の二層バー + 目標ライン */}
      <div
        className="relative h-2 overflow-hidden rounded-full"
        style={{ background: "rgba(28,20,16,0.06)" }}
        role="img"
        aria-label={`今月の支出 ${formatYen(monthSummary.expense)}、月末予測 ${formatYen(forecast.projectedMonthEndExpense)}`}
      >
        <motion.div
          className="absolute h-full"
          initial={{ width: 0 }}
          animate={{ width: `${forecast.actualExpensePct}%` }}
          transition={{ ...SPRING.smooth, delay: 0.3 }}
          style={{ background: tokens.bar, borderRadius: "9999px 0 0 9999px" }}
        />
        <motion.div
          className="absolute h-full"
          initial={{ width: 0 }}
          animate={{
            width: `${Math.max(0, Math.min(100 - forecast.actualExpensePct, forecast.projectedExpensePct - forecast.actualExpensePct))}%`,
          }}
          transition={{ ...SPRING.smooth, delay: 0.5 }}
          style={{ left: `${forecast.actualExpensePct}%`, background: tokens.barLight }}
        />
        {forecast.targetLinePct !== null && (
          <div
            className="absolute top-0 h-full w-0.5"
            style={{ left: `${forecast.targetLinePct}%`, background: "rgba(28,20,16,0.28)" }}
          />
        )}
      </div>
      <div
        className="mt-1 text-right text-[10px]"
        style={{ color: "var(--foreground)", opacity: 0.42 }}
      >
        {dayOfMonth}日経過 / {daysInMonth}日
      </div>

      {/* 3指標フッター */}
      <div
        className="mt-3 grid grid-cols-3 gap-2 border-t pt-3"
        style={{ borderColor: "var(--border-default)" }}
      >
        {stats.map((item) => (
          <div key={item.label} className="text-center">
            <div
              className="mb-0.5 text-[9px] font-semibold"
              style={{ color: "var(--foreground)", opacity: 0.42 }}
            >
              {item.label}
            </div>
            <div className="text-[12px] font-extrabold tabular-nums" style={{ color: item.color }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
