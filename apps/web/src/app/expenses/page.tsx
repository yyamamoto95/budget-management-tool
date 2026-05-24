import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getExpenses } from "@/lib/api/expense";
import { getCategories } from "@/lib/api/category";
import { ExpenseList } from "@/components/expense/ExpenseList";
import { ExpenseCreateForm } from "@/components/expense/ExpenseCreateForm";
import { AppShell } from "@/components/layout/AppShell";
import { ApiError } from "@/lib/api/client";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "支出一覧 | 家計管理",
};

const PAGE_SIZE = 20;

async function ExpenseListSection({ limit }: { limit: number }) {
  let data;
  const [expenseCategories, incomeCategories] = await Promise.all([
    getCategories(0).catch(() => []),
    getCategories(1).catch(() => []),
  ]);
  try {
    data = await getExpenses();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      redirect("/login");
    }
    throw err;
  }

  const all = data.expense ?? [];
  const totalOutgo = all
    .filter((e) => e.balanceType === 0)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = all
    .filter((e) => e.balanceType === 1)
    .reduce((sum, e) => sum + e.amount, 0);

  const visible = all.slice(0, limit);
  const remaining = all.length - visible.length;

  return (
    <div className="flex flex-col gap-4">
      {/* サマリー（全件集計） */}
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

      {/* 支出リスト */}
      <div
        className="rounded-2xl border border-[#1c1410]/12 bg-white px-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <ExpenseList expenses={visible} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />
      </div>

      {/* もっと見るボタン */}
      {remaining > 0 && (
        <Link
          href={`/expenses?limit=${limit + PAGE_SIZE}`}
          className="flex w-full items-center justify-center rounded-2xl border border-[#e8c8b0] bg-white py-3 text-sm font-bold text-[#f18840] transition-colors hover:bg-[#fff6ee]"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          もっと見る（残り{remaining}件）
        </Link>
      )}
    </div>
  );
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";
  const { limit: rawLimit } = await searchParams;
  const limit = Math.max(PAGE_SIZE, parseInt(rawLimit ?? "", 10) || PAGE_SIZE);

  const [expenseCategories, incomeCategories] = await Promise.all([
    getCategories(0).catch(() => []),
    getCategories(1).catch(() => []),
  ]);

  return (
    <AppShell userName={userId}>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-extrabold text-[#1c1410]">支出一覧</h1>

        {/* 新規登録フォーム */}
        <ExpenseCreateForm userId={userId} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />

        {/* 支出一覧（Server Component + Suspense でストリーミング） */}
        <Suspense
          fallback={
            <div className="py-12 text-center text-sm font-medium text-[#1c1410]/40">
              読み込み中...
            </div>
          }
        >
          <ExpenseListSection limit={limit} />
        </Suspense>
      </div>
    </AppShell>
  );
}
