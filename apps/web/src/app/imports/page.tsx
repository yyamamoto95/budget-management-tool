import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getCategories } from "@/lib/api/category";
import { AppShell } from "@/components/layout/AppShell";
import { ImportClient } from "@/components/imports/ImportClient";

export const metadata: Metadata = {
  title: "スクショ一括取り込み | 家計管理",
};

export default async function ImportsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";

  const [expenseCategories, incomeCategories] = await Promise.all([
    getCategories(0).catch(() => []),
    getCategories(1).catch(() => []),
  ]);

  return (
    <AppShell userName={userId}>
      <ImportClient expenseCategories={expenseCategories} incomeCategories={incomeCategories} />
    </AppShell>
  );
}
