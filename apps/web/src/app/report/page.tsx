import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getBudgets } from "@/lib/api/budget";
import { getCategories } from "@/lib/api/category";
import type { CategoryItem } from "@/lib/api/types";
import { PeriodSelector } from "@/components/report/PeriodSelector";
import { MonthlyComparisonCard } from "@/components/report/MonthlyComparisonCard";
import { CategoryDonutChart } from "@/components/report/CategoryDonutChart";
import { ReportDetailItem } from "@/components/report/ReportDetailItem";
import { AppShell } from "@/components/layout/AppShell";
import { calcMonthlyComparison } from "@budget/common";
import type { BudgetResponse } from "@budget/api-client";

export const metadata: Metadata = {
  title: "レポート | 家計管理",
};

type Period = "7days" | "current-month" | "last-month";

/** 期間に応じた日付範囲を返す（YYYY-MM-DD 文字列の配列 または month prefix） */
function getDateFilter(period: Period): (date: string) => boolean {
  const now = new Date();

  if (period === "7days") {
    const dates = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dates.add(d.toISOString().split("T")[0]);
    }
    return (date) => dates.has(date);
  }

  if (period === "current-month") {
    const prefix = now.toISOString().slice(0, 7); // YYYY-MM
    return (date) => date.startsWith(prefix);
  }

  // last-month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prefix = lastMonth.toISOString().slice(0, 7);
  return (date) => date.startsWith(prefix);
}

/** カテゴリ別集計（支出のみ）*/
function aggregateByCategory(
  budgets: BudgetResponse[],
  expenseCategories: CategoryItem[],
): { name: string; color: string; amount: number; pct: number }[] {
  const outgos = budgets.filter((b) => b.balanceType === 0);
  const total = outgos.reduce((s, b) => s + b.amount, 0);
  if (total === 0) return [];

  const map = new Map<number, number>();
  for (const b of outgos) {
    map.set(b.categoryId, (map.get(b.categoryId) ?? 0) + b.amount);
  }

  return [...map.entries()]
    .map(([id, amount]) => {
      const cat = expenseCategories.find((c) => c.id === id) ?? { name: "未分類", color: "#333333" };
      return { name: cat.name, color: cat.color, amount, pct: Math.round((amount / total) * 100) };
    })
    .sort((a, b) => b.amount - a.amount);
}

/** 日付ごとにグループ化する */
function groupByDate(budgets: BudgetResponse[]): Record<string, BudgetResponse[]> {
  const result: Record<string, BudgetResponse[]> = {};
  for (const b of budgets) {
    if (!result[b.date]) result[b.date] = [];
    result[b.date].push(b);
  }
  return result;
}

async function ReportSection({ period }: { period: Period }) {
  const [{ budget: allBudgets }, expenseCategories, incomeCategories] = await Promise.all([
    getBudgets(),
    getCategories(0).catch(() => [] as CategoryItem[]),
    getCategories(1).catch(() => [] as CategoryItem[]),
  ]);
  const filter = getDateFilter(period);
  const budgets = allBudgets.filter((b) => filter(b.date));

  // 当月表示のときのみ前月比・前年同月比を計算する
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const comparisonData = period === "current-month"
    ? calcMonthlyComparison(
        allBudgets.map((b) => ({ date: b.date, amount: b.amount, balanceType: b.balanceType })),
        currentMonthPrefix,
      )
    : null;

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <p className="py-12 text-center text-sm font-medium text-[#1c1410]/40">
          この期間のデータはありません
        </p>
        {comparisonData !== null && (
          <MonthlyComparisonCard data={comparisonData} />
        )}
      </div>
    );
  }

  const totalOutgo = budgets.filter((b) => b.balanceType === 0).reduce((s, b) => s + b.amount, 0);
  const totalIncome = budgets.filter((b) => b.balanceType === 1).reduce((s, b) => s + b.amount, 0);
  const categoryBreakdown = aggregateByCategory(budgets, expenseCategories);
  const grouped = groupByDate(budgets);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-6">
      {/* サマリー */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl border border-[#1c1410]/12 bg-white p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-xs font-bold text-[#1c1410]/50">支出合計</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums" style={{ color: "var(--color-expense)" }}>
            ¥{totalOutgo.toLocaleString()}
          </p>
        </div>
        <div
          className="rounded-2xl border border-[#1c1410]/12 bg-white p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-xs font-bold text-[#1c1410]/50">収入合計</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums" style={{ color: "var(--color-income)" }}>
            ¥{totalIncome.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 前月比・前年同月比（当月のみ） */}
      {comparisonData !== null && (
        <MonthlyComparisonCard data={comparisonData} />
      )}

      {/* カテゴリ別ドーナツチャート（支出） */}
      {categoryBreakdown.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-extrabold text-[#1c1410]">
            支出カテゴリ内訳
          </h2>
          <div
            className="rounded-2xl border border-[#1c1410]/12 bg-white p-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <CategoryDonutChart slices={categoryBreakdown} />
          </div>
        </section>
      )}

      {/* 日付別明細 */}
      <section>
        <h2 className="mb-3 text-sm font-extrabold text-[#1c1410]">
          明細
        </h2>
        <div className="flex flex-col gap-4">
          {sortedDates.map((date) => {
            const items = grouped[date];
            const income = items.filter((b) => b.balanceType === 1).reduce((s, b) => s + b.amount, 0);
            const outgo = items.filter((b) => b.balanceType === 0).reduce((s, b) => s + b.amount, 0);

            return (
              <section key={date}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#1c1410]">
                    {date}
                  </span>
                  <div className="flex gap-3 text-sm font-bold">
                    {income > 0 && (
                      <span style={{ color: "var(--color-income)" }}>
                        +¥{income.toLocaleString()}
                      </span>
                    )}
                    {outgo > 0 && (
                      <span style={{ color: "var(--color-expense)" }}>
                        -¥{outgo.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <ul
                  className="divide-y divide-[#e8c8b0] rounded-2xl border border-[#1c1410]/12 bg-white overflow-hidden"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  {items.map((item) => (
                    <ReportDetailItem key={item.id} item={item} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period: Period =
    rawPeriod === "current-month" || rawPeriod === "last-month"
      ? rawPeriod
      : "7days";

  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";

  return (
    <AppShell userName={userId}>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#1c1410]">
            レポート
          </h1>
          <PeriodSelector />
        </div>
        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-[#e8c8b0] bg-white"
                />
              ))}
            </div>
          }
        >
          <ReportSection period={period} />
        </Suspense>
      </main>
    </AppShell>
  );
}
