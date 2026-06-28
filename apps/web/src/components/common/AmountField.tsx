"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { SPRING } from "@/lib/motion";
import { MoneyInput } from "./MoneyInput";

type Props = {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  /** 下限。既定 0 */
  min?: number;
  /** 上限。未指定なら無制限 */
  max?: number;
  /** 接頭辞。既定 "¥"（空文字で非表示） */
  prefix?: string;
  suffix?: string;
  /** false で桁区切りなし */
  thousandSeparator?: boolean;
  /** 入力フィールドのアクセシブル名（a11y / E2E セレクタ用） */
  label?: string;
};

/**
 * ± ステッパー付き金額入力フィールド（Settings / Setup 共用）。
 * 数値入力ロジックは MoneyInput（react-number-format）に委譲し、
 * 上限/下限に達した側のステッパーは淡色 + not-allowed で非活性化する。
 */
export function AmountField({
  value,
  onChange,
  step = 1000,
  min = 0,
  max,
  prefix = "¥",
  suffix,
  thousandSeparator = true,
  label,
}: Props) {
  const [focused, setFocused] = useState(false);
  const clamp = (n: number) => Math.max(min, max != null ? Math.min(n, max) : n);
  const atMin = value <= min;
  const atMax = max != null && value >= max;

  // 非活性時は淡色化 + not-allowed で「これ以上押せない」ことを明示する
  const stepperStyle = (disabled: boolean) => ({
    background: "var(--color-surface-subtle)",
    color: "var(--foreground)",
    opacity: disabled ? 0.25 : 0.5,
    cursor: disabled ? "not-allowed" : "pointer",
  });

  return (
    <div className="flex items-center gap-1">
      {/* − ボタン */}
      <motion.button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base font-bold select-none transition-opacity"
        style={stepperStyle(atMin)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(clamp(value - step))}
        disabled={atMin}
        whileTap={atMin ? undefined : { scale: 0.85 }}
        transition={SPRING.snap}
        aria-label={`${step.toLocaleString("ja-JP")}円減らす`}
      >
        <Minus size={16} />
      </motion.button>

      {/* 入力フィールド */}
      <div
        className="flex flex-1 items-center gap-1.5 rounded-md border px-3 py-2 transition-colors"
        style={{
          borderColor: focused ? "var(--color-brand-primary)" : "var(--border-default)",
          background: focused ? "var(--color-brand-light)" : "var(--color-surface-default)",
        }}
      >
        {prefix && (
          <span
            className="shrink-0 text-xs font-semibold"
            style={{ color: "var(--foreground)", opacity: 0.45 }}
          >
            {prefix}
          </span>
        )}
        <MoneyInput
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          thousandSeparator={thousandSeparator}
          label={label}
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold tabular-nums outline-none"
          style={{ color: "var(--foreground)" }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base font-bold select-none transition-opacity"
        style={stepperStyle(atMax)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(clamp(value + step))}
        disabled={atMax}
        whileTap={atMax ? undefined : { scale: 0.85 }}
        transition={SPRING.snap}
        aria-label={`${step.toLocaleString("ja-JP")}円増やす`}
      >
        <Plus size={16} />
      </motion.button>
    </div>
  );
}
