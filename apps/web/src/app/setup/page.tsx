import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InitialSetupWizard } from "@/components/setup/InitialSetupWizard";

export const metadata: Metadata = { title: "初回設定 | 家計管理" };

export default async function SetupPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("setup_completed")) {
    redirect("/");
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--color-surface-default)" }}
    >
      <InitialSetupWizard />
    </div>
  );
}
