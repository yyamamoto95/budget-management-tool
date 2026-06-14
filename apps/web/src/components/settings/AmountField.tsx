"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SPRING } from "@/lib/motion";

type Props = {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
};

export function AmountField({ value, onChange, step = 1000, suffix }: Props) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");

  return (
    <div className="flex items-center gap-1">
      {/* − ボタン */}
      <motion.button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base font-bold select-none"
        style={{ background: "var(--color-surface-subtle)", color: "var(--foreground)", opacity: 0.5 }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(Math.max(0, value - step))}
        whileTap={{ scale: 0.85 }}
        transition={SPRING.snap}
        aria-label={`${step.toLocaleString("ja-JP")}円減らす`}
      >
        −
      </motion.button>

      {/* 入力フィールド */}
      <div
        className="flex flex-1 items-center gap-1.5 rounded-md border px-3 py-2 transition-colors"
        style={{
          borderColor: focused ? "var(--color-brand-primary)" : "var(--border-default)",
          background: focused ? "var(--color-brand-light)" : "var(--color-surface-default)",
        }}
      >
        <span
          className="shrink-0 text-xs font-semibold"
          style={{ color: "var(--foreground)", opacity: 0.45 }}
        >
          ¥
        </span>
        <input
          type="text"
          inputMode="numeric"
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold tabular-nums outline-none"
          style={{ color: "var(--foreground)" }}
          value={focused ? raw : value.toLocaleString("ja-JP")}
          onFocus={() => {
            setFocused(true);
            setRaw(value.toString());
          }}
          onBlur={() => {
            setFocused(false);
            const n = parseInt(raw, 10);
            if (!isNaN(n) && n >= 0) onChange(n);
          }}
          onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        />
        {suffix && (
          <span
            className="shrink-0 text-xs font-medium"
            style={{ color: "var(--foreground)", opacity: 0.45 }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* + ボタン */}
      <motion.button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base font-bold select-none"
        style={{ background: "var(--color-surface-subtle)", color: "var(--foreground)", opacity: 0.5 }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(value + step)}
        whileTap={{ scale: 0.85 }}
        transition={SPRING.snap}
        aria-label={`${step.toLocaleString("ja-JP")}円増やす`}
      >
        +
      </motion.button>
    </div>
  );
}
