"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { PAGE_VARIANTS, PAGE_ITEM_VARIANTS, SPRING } from "@/lib/motion";
import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";
import { PeriodFilter, type Period } from "./PeriodFilter";
import { SearchBar } from "./SearchBar";
import { ListView } from "./ListView";

type Props = {
  initialExpenses: ExpenseResponse[];
  allCategories: CategoryItem[];
  initialPeriod: Period;
  initialSearch: string;
  /** YYYY-MM-DD。指定時はその日の記録に絞り込み表示（#463） */
  initialDate?: string | null;
};

/** "2026-07-08" → "7月8日" */
function formatDateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

export function RecordsPage({
  initialExpenses,
  allCategories,
  initialPeriod,
  initialSearch,
  initialDate = null,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [search, setSearch] = useState(initialSearch);

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryItem>();
    for (const cat of allCategories) {
      map.set(`${cat.balanceType}-${cat.id}`, cat);
    }
    return map;
  }, [allCategories]);

  const navigate = useCallback(
    (p: Period, s: string) => {
      const params = new URLSearchParams();
      if (p !== "month") params.set("period", p);
      if (s) params.set("search", s);
      const qs = params.toString();
      startTransition(() => {
        router.push(`/records${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [router, startTransition],
  );

  const handlePeriodChange = useCallback(
    (p: Period) => {
      setPeriod(p);
      navigate(p, search);
    },
    [search, navigate],
  );

  const handleSearchChange = useCallback(
    (s: string) => {
      setSearch(s);
      // 検索はデバウンス不要（サーバーコンポーネントの再フェッチで対応）
      navigate(period, s);
    },
    [period, navigate],
  );

  // 集計
  const totalExpense = initialExpenses
    .filter((e) => e.balanceType === 0)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = initialExpenses
    .filter((e) => e.balanceType === 1)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 md:px-6 md:py-5">
      <motion.div variants={PAGE_VARIANTS} initial="hidden" animate="visible">
        {/* スティッキーコントロール */}
        <motion.div variants={PAGE_ITEM_VARIANTS}>
          <div
            className="sticky top-0 z-10 -mx-4 px-4 pb-2 pt-1 md:-mx-6 md:px-6"
            style={{
              background: "rgba(255,253,245,0.96)",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* 日付絞り込みチップ（ホームの行タップ遷移 #463。期間・検索の操作で解除される） */}
            {initialDate && (
              <div className="flex items-center gap-2 pb-1.5 pt-1">
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                  style={{
                    background: "var(--color-brand-light)",
                    borderColor: "rgba(241,136,64,0.30)",
                    color: "var(--color-brand-primary)",
                  }}
                >
                  {formatDateLabel(initialDate)}の記録
                  <button
                    type="button"
                    aria-label="日付の絞り込みを解除"
                    className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-[rgba(241,136,64,0.15)]"
                    onClick={() => navigate(period, search)}
                  >
                    <X size={10} />
                  </button>
                </span>
              </div>
            )}
            {/* 期間フィルタ */}
            <div className="flex items-center gap-2 pb-1.5 pt-1">
              <PeriodFilter value={period} onChange={handlePeriodChange} />
            </div>
            {/* 検索バー */}
            <SearchBar value={search} onChange={handleSearchChange} />
          </div>
        </motion.div>

        {/* サマリー */}
        <motion.div variants={PAGE_ITEM_VARIANTS} className="mb-3">
          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-xl border p-3"
              style={{
                background: "var(--color-surface-default)",
                borderColor: "var(--border-default)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <p
                className="text-[11px] font-bold"
                style={{ color: "var(--foreground)", opacity: 0.45 }}
              >
                支出合計
              </p>
              <p
                className="mt-0.5 text-lg font-extrabold tabular-nums"
                style={{ color: "var(--color-expense)" }}
              >
                ¥{totalExpense.toLocaleString("ja-JP")}
              </p>
            </div>
            <div
              className="rounded-xl border p-3"
              style={{
                background: "var(--color-surface-default)",
                borderColor: "var(--border-default)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <p
                className="text-[11px] font-bold"
                style={{ color: "var(--foreground)", opacity: 0.45 }}
              >
                収入合計
              </p>
              <p
                className="mt-0.5 text-lg font-extrabold tabular-nums"
                style={{ color: "var(--color-income)" }}
              >
                ¥{totalIncome.toLocaleString("ja-JP")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* リストビュー */}
        <motion.div variants={PAGE_ITEM_VARIANTS}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${period}-${search}-${initialDate ?? ""}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={SPRING.quick}
            >
              <ListView
                expenses={initialExpenses}
                categoryMap={categoryMap}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}
