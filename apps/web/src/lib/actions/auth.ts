"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch, ApiError } from "../api/client";
import { getSettings } from "../api/settings";
import type { LoginResponse, LogoutResponse } from "../api/types";
import { loginSchema } from "@budget/common";

/** 初回設定完了 Cookie の有効期間（1年） */
const SETUP_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

// アクセストークン：15分（APIと揃える）
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
// リフレッシュトークン：7日（APIと揃える）
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export type LoginFieldErrors = {
  userId?: string[];
  password?: string[];
};

export type LoginState = {
  error: string | null;
  fieldErrors?: LoginFieldErrors;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  userId?: string;
};

/** ログイン成功後に JWT Cookie をセットする */
async function setTokenCookies({ accessToken, refreshToken, userId }: TokenPair): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
  });

  if (userId) {
    // ヘッダー表示用（httpOnly 不要）
    cookieStore.set("user_id", userId, {
      httpOnly: false,
      secure,
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: "/",
    });
  }
}

/** Cookie に保存された JWT を削除する */
async function clearTokenCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_id");
}

/** DBの初回設定フラグをクッキーに同期する（完了済み→セット / 未完了→削除） */
async function syncSetupCookie(): Promise<void> {
  try {
    const settings = await getSettings();
    const cookieStore = await cookies();
    if (settings.initialSetupCompleted) {
      cookieStore.set("setup_completed", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: SETUP_COOKIE_MAX_AGE,
        path: "/",
      });
    } else {
      cookieStore.delete("setup_completed");
    }
  } catch {
    // 設定取得失敗時はクッキーなしで続行（middlewareが /setup にリダイレクト）
  }
}

/** ログイン Server Action */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    userId: String(formData.get("userId") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors as LoginFieldErrors;
    return { error: null, fieldErrors };
  }

  try {
    const res = await serverFetch<LoginResponse & TokenPair>("/api/login", {
      method: "POST",
      body: JSON.stringify(result.data),
    });
    await setTokenCookies({ ...res, userId: res.userId });
    await syncSetupCookie();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return { error: "ユーザー名またはパスワードが正しくありません" };
    }
    return { error: "サーバーに接続できませんでした" };
  }

  // ログイン後は常にホームへ遷移する（#549。returnTo による直前ページ復帰は廃止し、
  // セッション切れの通知は LoginForm のトースト表示のみに使う）
  redirect("/");
}

/** ゲストログイン Server Action */
export async function guestLoginAction(_formData: FormData): Promise<void> {
  const res = await serverFetch<LoginResponse & TokenPair>("/api/guest-login", {
    method: "POST",
  });
  await setTokenCookies({ ...res, userId: res.userId });
  await syncSetupCookie();

  // ログイン後は常にホームへ遷移する（#549）
  redirect("/");
}

/** ログアウト Server Action */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  try {
    await serverFetch<LogoutResponse>("/api/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // ログアウトはベストエフォート — API エラーでも Cookie は削除する
  }

  await clearTokenCookies();
  redirect("/login");
}
