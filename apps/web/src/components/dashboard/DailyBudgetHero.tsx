"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { SPRING } from "@/lib/motion";

type Tone = "safe" | "caution" | "danger";

function budgetTone(ratio: number): Tone {
  if (ratio >= 0.8) return "safe";
  if (ratio >= 0.2) return "caution";
  return "danger";
}

const TONE_LABELS: Record<Tone, string> = {
  safe: "余裕",
  caution: "注意",
  danger: "ピンチ",
};

type Props = {
  dailyBudget: {
    amount: number;
    remaining: number;
    ratio: number;
    daysUntilPayday: number;
  } | null;
  todayExpense: number;
};

export function DailyBudgetHero({ dailyBudget, todayExpense }: Props) {
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
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            background: `var(--color-status-${tone}-badge)`,
            color: "#fff",
          }}
        >
          {TONE_LABELS[tone]}
        </span>
      </div>

      <div
        className="text-3xl font-extrabold tabular-nums lg:text-4xl"
        style={{ color: `var(--color-status-${tone}-hero)` }}
      >
        &yen;{dailyBudget.remaining.toLocaleString()}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: "var(--foreground)", opacity: 0.55 }}>
        <span>1日予算 &yen;{dailyBudget.amount.toLocaleString()}</span>
        <span>|</span>
        <span>今日の支出 &yen;{todayExpense.toLocaleString()}</span>
      </div>

      <div className="mt-2 text-[11px] font-medium" style={{ color: "var(--foreground)", opacity: 0.4 }}>
        給料日まであと {dailyBudget.daysUntilPayday} 日
      </div>
    </motion.div>
  );
}
