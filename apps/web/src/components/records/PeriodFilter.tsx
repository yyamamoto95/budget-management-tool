"use client";

import { motion } from "framer-motion";
import { PERIOD_LABELS } from "@budget/common";
import { SPRING } from "@/lib/motion";

export type Period = "week" | "month" | "lastMonth" | "all";

// ラベルは @budget/common の PERIOD_LABELS に共通化（#539）
const PERIOD_OPTIONS: { value: Period; label: string }[] = (
  ["week", "month", "lastMonth", "all"] as const
).map((value) => ({ value, label: PERIOD_LABELS[value] }));

type Props = {
  value: Period;
  onChange: (period: Period) => void;
};

export function PeriodFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-1 gap-1 overflow-x-auto">
      {PERIOD_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold"
            style={{
              background: active
                ? "var(--color-brand-primary)"
                : "var(--color-surface-subtle)",
              color: active ? "#fff" : "var(--foreground)",
              opacity: active ? 1 : 0.55,
            }}
            whileTap={{ scale: 0.93 }}
            transition={SPRING.snap}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
