import { Suspense } from "react";
import type { Metadata } from "next";
import { getExpenses } from "@/lib/api/expense";
import { ExpenseList } from "@/components/expense/ExpenseList";
import { ExpenseCreateForm } from "@/components/expense/ExpenseCreateForm";
import { Header } from "@/components/layout/Header";
import { ApiError } from "@/lib/api/client";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "支出一覧 | 家計管理",
};

async function ExpenseListSection() {
  let data;
  try {
    data = await getExpenses();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      redirect("/login");
    }
    throw err;
  }

  const expenses = data.expense ?? [];
  const totalOutgo = expenses
    .filter((e) => e.balanceType === 0)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = expenses
    .filter((e) => e.balanceType === 1)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col gap-4">
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

      {/* 支出リスト */}
      <div
        className="rounded-2xl border border-[#1c1410]/12 bg-white px-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <ExpenseList expenses={expenses} />
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  // TODO: セッションからuserIdを取得する（現在はゲストIDをプレースホルダーとして使用）
  const userId = "Guest";

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdf5]">
      <Header userName={userId} />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-extrabold text-[#1c1410]">支出一覧</h1>

        {/* 新規登録フォーム */}
        <ExpenseCreateForm userId={userId} />

      {/* 支出一覧（Server Component + Suspense でストリーミング） */}
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm font-medium text-[#1c1410]/40">
            読み込み中...
          </div>
        }
      >
        <ExpenseListSection />
      </Suspense>
      </div>
    </div>
  );

}
