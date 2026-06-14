import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { MyPageClient } from "@/components/my-page/MyPageClient";

export const metadata: Metadata = { title: "マイページ | 家計管理" };

export default async function MyPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? "Guest";

  return (
    <AppShell userName={userId}>
      <MyPageClient userName={userId} />
    </AppShell>
  );
}
