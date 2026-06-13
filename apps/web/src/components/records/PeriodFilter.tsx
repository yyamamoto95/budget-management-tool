"use client";

import { motion } from "framer-motion";
import { SPRING } from "@/lib/motion";

export type Period = "week" | "month" | "lastMonth" | "all";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "直近7日" },
  { value: "month", label: "今月" },
  { value: "lastMonth", label: "先月" },
  { value: "all", label: "全期間" },
];

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
