import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getExpenses } from "@/lib/api/expense";
import { getCategories } from "@/lib/api/category";
import { ApiError } from "@/lib/api/client";
import { AppShell } from "@/components/layout/AppShell";
import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";
import { CalendarView } from "@/components/calendar/CalendarView";

export const metadata: Metadata = {
  title: "カレンダー | 家計管理",
};

async function CalendarContent({ userId }: { userId: string }) {
  let expenses: ExpenseResponse[];
  const [expenseCategories, incomeCategories] = await Promise.all([
    getCategories(0).catch(() => [] as CategoryItem[]),
    getCategories(1).catch(() => [] as CategoryItem[]),
  ]);
  try {
    const data = await getExpenses();
    expenses = data.expense ?? [];
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect("/login");
    }
    throw err;
  }

  const allCategories = [...expenseCategories, ...incomeCategories];
  return <CalendarView expenses={expenses} userId={userId} allCategories={allCategories} />;
}

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";

  return (
    <AppShell userName={userId}>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm font-medium text-[#1c1410]/40">
            読み込み中...
          </div>
        }
      >
        <CalendarContent userId={userId} />
      </Suspense>
    </AppShell>
  );
}
