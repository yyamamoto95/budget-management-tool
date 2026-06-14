import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getExpenses } from "@/lib/api/expense";
import { getCategories } from "@/lib/api/category";
import { ApiError } from "@/lib/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { ReportClient } from "@/components/report/ReportClient";
import type { Period } from "@/components/records/PeriodFilter";

export const metadata: Metadata = {
  title: "レポート | 家計管理",
};

const VALID_PERIODS: Period[] = ["week", "month", "lastMonth"];

async function ReportContent({
  period,
}: {
  period: Period;
}) {
  // 現在の期間 + 先月比用に lastMonth も取得
  const fetches = [
    getExpenses({ period }),
    getCategories(0),
    getCategories(1),
    period === "month"
      ? getExpenses({ period: "lastMonth" })
      : Promise.resolve(null),
  ] as const;

  const [expensesResult, expenseCatsResult, incomeCatsResult, lastMonthResult] =
    await Promise.allSettled(fetches);

  if (
    expensesResult.status === "rejected" &&
    expensesResult.reason instanceof ApiError
  ) {
    if (
      expensesResult.reason.status === 401 ||
      expensesResult.reason.status === 403
    ) {
      redirect("/login");
    }
  }

  if (expensesResult.status === "rejected") throw expensesResult.reason;

  const expenses = expensesResult.value.expense ?? [];
  const expenseCategories =
    expenseCatsResult.status === "fulfilled" ? expenseCatsResult.value : [];
  const incomeCategories =
    incomeCatsResult.status === "fulfilled" ? incomeCatsResult.value : [];
  const allCategories = [...expenseCategories, ...incomeCategories];

  // 先月の支出合計（今月表示時のみ）
  let lastMonthExpense: number | null = null;
  if (
    lastMonthResult.status === "fulfilled" &&
    lastMonthResult.value !== null
  ) {
    const lastMonthData = lastMonthResult.value.expense ?? [];
    lastMonthExpense = lastMonthData
      .filter((e) => e.balanceType === 0)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  return (
    <ReportClient
      initialExpenses={expenses}
      allCategories={allCategories}
      initialPeriod={period}
      lastMonthExpense={lastMonthExpense}
    />
  );
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";
  const params = await searchParams;

  const period: Period = VALID_PERIODS.includes(params.period as Period)
    ? (params.period as Period)
    : "month";

  return (
    <AppShell userName={userId}>
      <Suspense
        fallback={
          <div
            className="flex flex-1 items-center justify-center text-sm font-medium"
            style={{ color: "var(--foreground)", opacity: 0.4 }}
          >
            読み込み中...
          </div>
        }
      >
        <ReportContent period={period} />
      </Suspense>
    </AppShell>
  );
}
