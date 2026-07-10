"use client";

import { useActionState } from "react";
import { loginAction, guestLoginAction } from "@/lib/actions/auth";
import type { LoginState } from "@/lib/actions/auth";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionExpiredToast } from "./SessionExpiredToast";

const initialState: LoginState = { error: null };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="mt-1 text-xs font-medium text-[#f87171]">
      {messages[0]}
    </p>
  );
}

function NotificationBanner() {
  const params = useSearchParams();
  if (params.get("registered") === "1") {
    return (
      <p className="mb-4 rounded-xl border border-[#35b5a2]/40 bg-[#ecfaf8] px-3 py-2 text-sm font-medium text-[#1c1410]">
        アカウントを作成しました。ログインしてください。
      </p>
    );
  }
  if (params.get("reset") === "1") {
    return (
      <p className="mb-4 rounded-xl border border-[#35b5a2]/40 bg-[#ecfaf8] px-3 py-2 text-sm font-medium text-[#1c1410]">
        パスワードを再設定しました。新しいパスワードでログインしてください。
      </p>
    );
  }
  return null;
}

type Props = {
  /** セッション切れでリダイレクトされてきたか（middleware が expired=1 を付与） */
  sessionExpired?: boolean;
};

export function LoginForm({ sessionExpired }: Props) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fef5ee] px-4 gap-6">
      {/* ブランドロゴ + キャッチコピー（カード外・上部） */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-3">
          <Image
            src="/logo192.png"
            alt="Budget"
            width={48}
            height={48}
            className="rounded-2xl"
            style={{ boxShadow: "0 1px 4px rgba(28,20,16,0.08)" }}
          />
          <span className="text-2xl font-extrabold text-[#1c1410] tracking-tight">
            Budget
          </span>
        </div>
        <p className="text-sm text-[#1c1410]/60 font-medium">
          家計を、もっとシンプルに。
        </p>
      </div>

      <section className="w-full max-w-sm rounded-2xl border border-[rgba(28,20,16,0.08)] bg-white p-8" style={{ boxShadow: "var(--shadow-card)" }}>
        <h1 className="mb-5 text-lg font-bold text-[#1c1410]">ログイン</h1>

        <Suspense>
          <NotificationBanner />
        </Suspense>

        {sessionExpired && <SessionExpiredToast />}

        {/* ログイン後は常にホームへ遷移するため returnTo はトースト表示のみに使う（#549） */}
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="userId" className="text-sm font-semibold text-[#1c1410]">
              ユーザー名
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              required
              autoComplete="username"
              placeholder="ユーザー名を入力"
              className="input-pop"
            />
            <FieldError messages={state.fieldErrors?.userId} />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-[#1c1410]">
                パスワード
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#1c1410]/50 underline underline-offset-2 hover:text-[#f18840] transition-colors"
              >
                忘れた場合
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="パスワードを入力"
              className="input-pop"
            />
            <FieldError messages={state.fieldErrors?.password} />
          </div>

          {state.error && (
            <p className="rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#1c1410]">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-candy w-full mt-2 disabled:opacity-50"
          >
            {isPending ? "ログイン中..." : "ログインする"}
          </button>
        </form>

        <div className="mt-4 border-t border-[rgba(28,20,16,0.08)] pt-4 space-y-3">
          <form action={guestLoginAction}>
            <button type="submit" className="btn-ghost w-full">
              ゲストユーザーでログイン
            </button>
          </form>
          <p className="text-center text-sm text-[#1c1410]/60">
            アカウントをお持ちでない方は{" "}
            <Link
              href="/register"
              className="font-semibold text-[#f18840] underline underline-offset-2 hover:text-[#e07030] transition-colors"
            >
              新規登録
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
