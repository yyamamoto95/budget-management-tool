"use client";

import { motion } from "framer-motion";
import { SPRING } from "@/lib/motion";

type CategoryData = {
  label: string;
  amount: number;
  color: string;
};

type Props = {
  categories: CategoryData[];
  totalExpense: number;
};

export function CategoryBreakdown({ categories, totalExpense }: Props) {
  return (
    <div
      className="overflow-hidden rounded-2xl border p-4"
      style={{
        background: "var(--color-surface-default)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className="text-[13px] font-extrabold"
          style={{ color: "var(--foreground)" }}
        >
          カテゴリ別支出
        </span>
        <span
          className="text-[11px] font-semibold"
          style={{ color: "var(--foreground)", opacity: 0.42 }}
        >
          合計 ¥{totalExpense.toLocaleString("ja-JP")}
        </span>
      </div>

      {/* 積み上げカラーバー */}
      <div className="mb-4 flex h-3 gap-px overflow-hidden rounded-full">
        {categories.map((cat) => (
          <motion.div
            key={cat.label}
            style={{ background: cat.color }}
            animate={{ width: totalExpense > 0 ? `${(cat.amount / totalExpense) * 100}%` : "0%" }}
            transition={SPRING.base}
          />
        ))}
      </div>

      {/* カテゴリリスト */}
      <div className="space-y-3">
        {categories.map((cat, i) => {
          const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
          return (
            <motion.div
              key={cat.label}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING.base, delay: i * 0.04 }}
            >
              {/* カラードット */}
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: cat.color }}
              />
              {/* ラベル */}
              <span
                className="w-28 shrink-0 truncate text-[12px] font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {cat.label}
              </span>
              {/* プログレスバー */}
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--color-surface-subtle)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: cat.color }}
                  animate={{ width: `${pct}%` }}
                  transition={SPRING.base}
                />
              </div>
              {/* % */}
              <span
                className="w-8 shrink-0 text-right text-[10px] font-bold tabular-nums"
                style={{ color: "var(--foreground)", opacity: 0.42 }}
              >
                {pct.toFixed(0)}%
              </span>
              {/* 金額 */}
              <span
                className="w-16 shrink-0 text-right text-[12px] font-extrabold tabular-nums"
                style={{ color: "var(--foreground)" }}
              >
                {cat.amount >= 10000
                  ? `¥${(cat.amount / 10000).toFixed(1)}万`
                  : `¥${cat.amount.toLocaleString("ja-JP")}`}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
