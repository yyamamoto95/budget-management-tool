"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { putSettings } from "@/lib/api/settings";
import type { UpsertUserSettingsBody } from "@budget/api-client";

/** 初回設定完了 Cookie の有効期間（1年） */
const SETUP_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export type SettingsActionState = {
  error: string | null;
  success: boolean;
};

/**
 * 初回設定用: ユーザー設定を保存し、完了 Cookie をセットしてホームへリダイレクト。
 * エラー時は { error: string } を返す（redirect は try/catch 外で実行する Next.js の作法に従う）。
 */
export async function saveUserSettingsAction(
    data: UpsertUserSettingsBody,
): Promise<{ error: string } | null> {
    try {
        await putSettings({ ...data, initialSetupCompleted: true });
        const cookieStore = await cookies();
        cookieStore.set("setup_completed", "1", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: SETUP_COOKIE_MAX_AGE,
            path: "/",
        });
    } catch (e) {
        return {
            error: e instanceof Error ? e.message : "設定の保存に失敗しました",
        };
    }
    redirect("/");
}

/** 設定ページから直接呼び出す Server Action（JSON 形式） */
export async function saveSettingsAction(
  data: UpsertUserSettingsBody,
): Promise<SettingsActionState> {
  try {
    await putSettings(data);
    return { error: null, success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "保存に失敗しました", success: false };
  }
}

/** ユーザー設定をサーバーに保存する Server Action */
export async function upsertSettingsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const totalAssets = Number(formData.get("totalAssets") ?? 0);
  const monthlyIncome = Number(formData.get("monthlyIncome") ?? 0);
  // 給料日・固定費はフォームになければデフォルト値を使用（UI拡張は #133 で対応予定）
  const paydayDay = Number(formData.get("paydayDay") ?? 25);
  const fixedExpenses = Number(formData.get("fixedExpenses") ?? 0);

  if (Number.isNaN(totalAssets) || totalAssets < 0) {
    return { error: "総資産は0以上の値を入力してください", success: false };
  }
  if (Number.isNaN(monthlyIncome) || monthlyIncome < 0) {
    return { error: "月次収入は0以上の値を入力してください", success: false };
  }
  if (Number.isNaN(paydayDay) || paydayDay < 1 || paydayDay > 31) {
    return { error: "給料日は1〜31の範囲で入力してください", success: false };
  }
  if (Number.isNaN(fixedExpenses) || fixedExpenses < 0) {
    return { error: "固定費は0以上の値を入力してください", success: false };
  }

  try {
    await putSettings({ totalAssets, monthlyIncome, paydayDay, fixedExpenses });
    return { error: null, success: true };
  } catch {
    return { error: "保存に失敗しました。しばらくしてから再度お試しください", success: false };
  }
}
