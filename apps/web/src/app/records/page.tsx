import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getExpenses } from "@/lib/api/expense";
import { getCategories } from "@/lib/api/category";
import { ApiError } from "@/lib/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { RecordsPage } from "@/components/records/RecordsPage";

export const metadata: Metadata = {
  title: "明細 | 家計管理",
};

type Period = "week" | "month" | "lastMonth" | "all";

const VALID_PERIODS: Period[] = ["week", "month", "lastMonth", "all"];

async function RecordsContent({
  period,
  search,
}: {
  period: Period;
  search: string;
}) {
  const [expensesResult, expenseCatsResult, incomeCatsResult] =
    await Promise.allSettled([
      getExpenses({ period, search: search || undefined }),
      getCategories(0),
      getCategories(1),
    ]);

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

  return (
    <RecordsPage
      initialExpenses={expenses}
      allCategories={allCategories}
      initialPeriod={period}
      initialSearch={search}
    />
  );
}

export default async function RecordsPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; search?: string }>;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";
  const params = await searchParams;

  const period: Period = VALID_PERIODS.includes(params.period as Period)
    ? (params.period as Period)
    : "month";
  const search = params.search ?? "";

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
        <RecordsContent period={period} search={search} />
      </Suspense>
    </AppShell>
  );
}
