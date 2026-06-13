"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { SPRING } from "@/lib/motion";

type Props = {
  monthSummary: { expense: number; income: number };
  lastMonthExpense: number;
};

function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function formatYenSigned(n: number): string {
  return `${n >= 0 ? "+" : "−"}¥${Math.abs(Math.round(n)).toLocaleString("ja-JP")}`;
}

export function MonthlySummaryCard({ monthSummary, lastMonthExpense }: Props) {
  const netMonth = monthSummary.income - monthSummary.expense;
  const savingsRate = monthSummary.income > 0
    ? Math.round((netMonth / monthSummary.income) * 100)
    : 0;

  // 先月比: 日割り平均で比較
  const now = new Date();
  const dayOfMonth = now.getDate();
  const lastMonthDailyAvg = lastMonthExpense / 30;
  const thisMonthDailyAvg = monthSummary.expense / Math.max(1, dayOfMonth);
  const momPct = lastMonthDailyAvg > 0
    ? Math.round((thisMonthDailyAvg / lastMonthDailyAvg - 1) * 100)
    : 0;
  const momSaved = momPct < 0;

  const sRate = monthSummary.income > 0
    ? Math.round((netMonth / monthSummary.income) * 100)
    : 0;

  const monthLabel = `${now.getFullYear()} / ${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <motion.div
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
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
          今月のサマリー
        </span>
        <span className="font-mono text-[11px]" style={{ color: "var(--foreground)", opacity: 0.42 }}>
          {monthLabel}
        </span>
      </div>

      {/* 収支差ヒーロー */}
      <div className="mb-3 flex items-end gap-2">
        <span
          className="text-3xl font-black tabular-nums"
          style={{
            color: netMonth >= 0 ? "var(--color-income)" : "#f43f5e",
            letterSpacing: "-0.02em",
          }}
        >
          {formatYen(netMonth)}
        </span>
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.base, delay: 0.4 }}
          className="mb-0.5 flex items-center gap-0.5 text-xs font-semibold"
          style={{ color: savingsRate >= 20 ? "var(--color-income)" : "#f59e0b" }}
        >
          <ArrowUpRight size={12} />
          {savingsRate}%
        </motion.span>
      </div>

      {/* 収入・支出 */}
      <div className="mb-3 space-y-1.5">
        {[
          { label: "収入", value: formatYen(monthSummary.income), colorVar: "var(--color-income)", Icon: ArrowUpRight },
          { label: "支出", value: formatYen(monthSummary.expense), colorVar: "var(--color-brand-primary)", Icon: ArrowDownRight },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: item.colorVar }}>
              <item.Icon size={11} />
              {item.label}
            </span>
            <span
              className="text-[13px] font-bold tabular-nums"
              style={{ color: "var(--foreground)" }}
            >
              {item.value}
            </span>
          </div>
        ))}
        <div
          className="flex items-center justify-between border-t pt-1.5"
          style={{ borderColor: "var(--border-default)" }}
        >
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "var(--foreground)", opacity: 0.42 }}
          >
            <Wallet size={10} />
            収支差
          </span>
          <span
            className="text-[13px] font-extrabold tabular-nums"
            style={{ color: netMonth >= 0 ? "var(--color-income)" : "#f43f5e" }}
          >
            {formatYenSigned(netMonth)}
          </span>
        </div>
      </div>

      {/* 先月比 + 貯蓄率 */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5"
          style={{
            background: momSaved
              ? "var(--color-income-light)"
              : "rgba(244,63,94,0.06)",
          }}
        >
          <span className="text-[9px] font-semibold" style={{ color: "var(--foreground)", opacity: 0.42 }}>
            先月比 支出
          </span>
          <span
            className="text-[18px] font-extrabold tabular-nums"
            style={{
              color: momSaved ? "var(--color-income)" : "#f43f5e",
              letterSpacing: "-0.02em",
            }}
          >
            {momPct > 0 ? "+" : ""}
            {momPct}%
          </span>
          <span className="text-[9px]" style={{ color: "var(--foreground)", opacity: 0.42 }}>
            {momSaved
              ? `月換算で${formatYen(Math.round((lastMonthDailyAvg - thisMonthDailyAvg) * 30))}節約`
              : "先月より支出増"}
          </span>
        </div>
        <div
          className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5"
          style={{ background: "var(--color-income-light)" }}
        >
          <span className="text-[9px] font-semibold" style={{ color: "var(--foreground)", opacity: 0.42 }}>
            今月の貯蓄率
          </span>
          <span
            className="text-[18px] font-extrabold tabular-nums"
            style={{ color: "var(--color-income)", letterSpacing: "-0.02em" }}
          >
            {sRate}%
          </span>
          <span className="text-[9px]" style={{ color: "var(--foreground)", opacity: 0.42 }}>
            収入の{sRate}%を貯蓄ペース
          </span>
        </div>
      </div>
    </motion.div>
  );
}
