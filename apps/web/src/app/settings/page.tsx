import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { getSettings } from "@/lib/api/settings";

export const metadata: Metadata = { title: "設定 | 家計管理" };

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";

  const settings = await getSettings().catch(() => ({
    paydayDay: 25,
    monthlyIncome: 0,
    fixedExpenses: 0,
    totalAssets: 0,
    fixedExpensesDetail: null,
    initialSetupCompleted: false,
  }));

  return (
    <AppShell userName={userId}>
      <SettingsClient settings={settings} />
    </AppShell>
  );
}
