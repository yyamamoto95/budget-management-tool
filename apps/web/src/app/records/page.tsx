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
  date,
}: {
  period: Period;
  search: string;
  /** YYYY-MM-DD。指定時はその日の記録に絞り込む（#463） */
  date: string | null;
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

  const fetched = expensesResult.value.expense ?? [];
  const expenses = date ? fetched.filter((e) => e.date === date) : fetched;
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
      initialDate={date}
    />
  );
}

export default async function RecordsPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; search?: string; date?: string }>;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";
  const params = await searchParams;

  // date 指定時（ホームの行タップ遷移 #463）は全期間から該当日に絞り込む
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? (params.date as string) : null;
  const requestedPeriod: Period = VALID_PERIODS.includes(params.period as Period)
    ? (params.period as Period)
    : "month";
  const period: Period = date ? "all" : requestedPeriod;
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
        <RecordsContent period={period} search={search} date={date} />
      </Suspense>
    </AppShell>
  );
}
