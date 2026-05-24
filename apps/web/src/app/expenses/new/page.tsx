import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ExpenseCreateForm } from "@/components/expense/ExpenseCreateForm";
import { getCategories } from "@/lib/api/category";

export const metadata: Metadata = {
  title: "収支を記録する | 家計管理",
};

type Props = {
  searchParams: Promise<{ date?: string; type?: string }>;
};

export default async function ExpenseNewPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;
  if (!userId) redirect("/login");

  const { date, type } = await searchParams;
  const defaultDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  const defaultBalanceType: 0 | 1 = type === "income" ? 1 : 0;

  const [expenseCategories, incomeCategories] = await Promise.all([
    getCategories(0).catch(() => []),
    getCategories(1).catch(() => []),
  ]);

  return (
    <AppShell userName={userId}>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <ExpenseCreateForm
          userId={userId}
          defaultDate={defaultDate}
          defaultBalanceType={defaultBalanceType}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
        />
      </main>
    </AppShell>
  );
}
