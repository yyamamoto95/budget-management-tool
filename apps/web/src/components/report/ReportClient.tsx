"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PAGE_VARIANTS, PAGE_ITEM_VARIANTS, SPRING } from "@/lib/motion";
import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";
import type { Period } from "@/components/records/PeriodFilter";
import { summarizeReportTotals, calcVsLastMonthPct, aggregateExpensesByCategory, vsLastMonthDisplay, type VsLastMonthTone } from "@budget/common";
import { CategoryBreakdown } from "./CategoryBreakdown";

const PERIOD_LABELS: Record<Period, string> = {
  week: "直近7日",
  month: "今月",
  lastMonth: "先月",
  all: "全期間",
};

// 判定・文言は @budget/common（vsLastMonthDisplay）に共通化。ここは配色マッピングのみ
const VS_LAST_CHIP_STYLE: Record<VsLastMonthTone, { background: string; color: string }> = {
  saving: { background: "var(--color-income-light)", color: "var(--color-income)" },
  even: { background: "var(--color-surface-subtle)", color: "var(--foreground)" },
  increase: { background: "#fff1f2", color: "#e11d48" },
};

type Props = {
  initialExpenses: ExpenseResponse[];
  allCategories: CategoryItem[];
  initialPeriod: Period;
  lastMonthExpense: number | null;
};

export function ReportClient({
  initialExpenses,
  allCategories,
  initialPeriod,
  lastMonthExpense,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const handlePeriodChange = useCallback(
    (p: Period) => {
      setPeriod(p);
      const params = new URLSearchParams();
      if (p !== "month") params.set("period", p);
      const qs = params.toString();
      startTransition(() => {
        router.push(`/report${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [router, startTransition],
  );

  // 集計（ロジックは @budget/common に共通化 — モバイルのレポート画面と単一実装）
  const { totalExpense, totalIncome, balance } = summarizeReportTotals(initialExpenses);

  // 先月比（今月のみ）
  const vsLastPct = period === "month" ? calcVsLastMonthPct(totalExpense, lastMonthExpense) : null;

  // カテゴリ別集計
  const categoryData = useMemo(
    () => aggregateExpensesByCategory(initialExpenses, allCategories),
    [initialExpenses, allCategories],
  );

  // レポートでは all を除外
  const reportPeriods: Period[] = ["week", "month", "lastMonth"];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 md:px-6 md:py-5">
      <motion.div variants={PAGE_VARIANTS} initial="hidden" animate="visible">
        {/* スティッキー期間タブ */}
        <motion.div variants={PAGE_ITEM_VARIANTS}>
          <div
            className="sticky top-0 z-10 -mx-4 px-4 py-2 md:-mx-6 md:px-6"
            style={{
              background: "rgba(255,253,245,0.96)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="flex gap-1">
              {reportPeriods.map((p) => {
                const active = period === p;
                const labels: Record<string, string> = {
                  week: "直近7日",
                  month: "今月",
                  lastMonth: "先月",
                };
                return (
                  <motion.button
                    key={p}
                    type="button"
                    onClick={() => handlePeriodChange(p)}
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
                    {labels[p]}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={SPRING.quick}
            className="space-y-4"
          >
            {/* 収支サマリーカード */}
            <motion.div variants={PAGE_ITEM_VARIANTS}>
              <div
                className="overflow-hidden rounded-2xl border p-5"
                style={{
                  background: "var(--color-surface-default)",
                  borderColor: "var(--border-default)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                {/* タイトル */}
                <div
                  className="mb-4 text-[12px] font-bold"
                  style={{ color: "var(--foreground)", opacity: 0.45 }}
                >
                  {PERIOD_LABELS[period]}の収支
                </div>

                {/* 支出合計（ヒーロー数字） */}
                <div className="mb-1">
                  <div
                    className="mb-1 text-[11px] font-bold"
                    style={{ color: "var(--foreground)", opacity: 0.45 }}
                  >
                    支出合計
                  </div>
                  <motion.div
                    className="text-[44px] font-extrabold tabular-nums leading-none"
                    style={{ color: "var(--foreground)" }}
                    initial={{ scale: 0.94, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={SPRING.quick}
                  >
                    ¥{totalExpense.toLocaleString("ja-JP")}
                  </motion.div>
                </div>

                {/* 先月比チップ（今月のみ） */}
                {vsLastPct !== null && (
                  <motion.div
                    className="mb-1 mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={VS_LAST_CHIP_STYLE[vsLastMonthDisplay(vsLastPct).tone]}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={SPRING.base}
                  >
                    {vsLastMonthDisplay(vsLastPct).label}
                  </motion.div>
                )}

                {/* セパレーター */}
                <div
                  className="my-4"
                  style={{ height: "1px", background: "var(--border-default)" }}
                />

                {/* 収入 + 収支差引（2カラム） */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div
                      className="mb-1 text-[11px] font-bold"
                      style={{ color: "var(--foreground)", opacity: 0.45 }}
                    >
                      収入
                    </div>
                    <motion.div
                      className="text-[24px] font-extrabold tabular-nums leading-none"
                      style={{ color: "var(--color-income)" }}
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 1 }}
                      transition={SPRING.quick}
                    >
                      +¥{totalIncome.toLocaleString("ja-JP")}
                    </motion.div>
                  </div>
                  <div>
                    <div
                      className="mb-1 text-[11px] font-bold"
                      style={{ color: "var(--foreground)", opacity: 0.45 }}
                    >
                      収支差引
                    </div>
                    <motion.div
                      className="text-[24px] font-extrabold tabular-nums leading-none"
                      style={{
                        color:
                          balance >= 0
                            ? "var(--color-income)"
                            : "#e11d48",
                      }}
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 1 }}
                      transition={SPRING.quick}
                    >
                      {balance >= 0
                        ? `+¥${balance.toLocaleString("ja-JP")}`
                        : `−¥${Math.abs(balance).toLocaleString("ja-JP")}`}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* カテゴリ別支出 */}
            {categoryData.length > 0 && (
              <motion.div variants={PAGE_ITEM_VARIANTS}>
                <CategoryBreakdown
                  categories={categoryData}
                  totalExpense={totalExpense}
                />
              </motion.div>
            )}

            {/* 明細リンク */}
            <motion.div variants={PAGE_ITEM_VARIANTS}>
              <Link
                href={`/records?period=${period}`}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border py-3 text-[13px] font-bold transition-colors"
                style={{
                  background: "var(--color-surface-default)",
                  borderColor: "var(--border-default)",
                  color: "var(--color-brand-primary)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                詳細な記録を見る
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
