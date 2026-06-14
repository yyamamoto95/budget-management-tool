"use client";

import Link from "next/link";
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf8f5] px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-[rgba(28,20,16,0.08)] bg-white p-8 text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <p className="text-6xl font-extrabold text-[#f18840]">500</p>
        <h1 className="mt-3 text-xl font-extrabold text-[#1c1410]">
          エラーが発生しました
        </h1>
        <p className="mt-2 text-sm text-[#1c1410]/50">
          しばらくしてから再試行してください。
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl bg-[#f18840] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80"
          >
            再試行する
          </button>
          <Link
            href="/"
            className="w-full rounded-xl border border-[#1c1410]/20 px-6 py-2.5 text-sm font-bold text-[#1c1410]/70 transition-colors hover:bg-[#fff6ee]"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
