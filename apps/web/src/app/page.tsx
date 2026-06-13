import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDashboard } from "@/lib/api/dashboard";
import { getCategories } from "@/lib/api/category";
import { ApiError } from "@/lib/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { HomeClient } from "@/components/dashboard/HomeClient";

export const metadata: Metadata = {
  title: "ホーム | 家計管理",
};

async function DashboardContent({ userId }: { userId: string }) {
  const [dashboardResult, expenseCatsResult, incomeCatsResult] = await Promise.allSettled([
    getDashboard(),
    getCategories(0),
    getCategories(1),
  ]);

  // 認証エラーはログインページにリダイレクト
  if (dashboardResult.status === "rejected" && dashboardResult.reason instanceof ApiError) {
    if (dashboardResult.reason.status === 401 || dashboardResult.reason.status === 403) {
      redirect("/login");
    }
  }

  if (dashboardResult.status === "rejected") throw dashboardResult.reason;

  const dashboard = dashboardResult.value;
  const expenseCategories = expenseCatsResult.status === "fulfilled" ? expenseCatsResult.value : [];
  const incomeCategories = incomeCatsResult.status === "fulfilled" ? incomeCatsResult.value : [];
  const allCategories = [...expenseCategories, ...incomeCategories];

  return (
    <HomeClient
      userId={userId}
      dashboard={dashboard}
      expenseCategories={expenseCategories}
      incomeCategories={incomeCategories}
      allCategories={allCategories}
    />
  );
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";

  return (
    <AppShell userName={userId}>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm font-medium" style={{ color: "var(--foreground)", opacity: 0.4 }}>
            読み込み中...
          </div>
        }
      >
        <DashboardContent userId={userId} />
      </Suspense>
    </AppShell>
  );
}
