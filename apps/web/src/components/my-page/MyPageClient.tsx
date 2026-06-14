"use client";

import { motion } from "framer-motion";
import { User, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SPRING, PAGE_VARIANTS, PAGE_ITEM_VARIANTS } from "@/lib/motion";
import { logoutAction } from "@/lib/actions/auth";

type Props = {
  userName: string;
};

export function MyPageClient({ userName }: Props) {
  const initial = userName.charAt(0).toUpperCase();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-4 md:px-6 md:py-5">
      <motion.div variants={PAGE_VARIANTS} initial="hidden" animate="visible">
        {/* 戻るリンク */}
        <motion.div variants={PAGE_ITEM_VARIANTS} className="mb-4">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-[12px] font-bold"
            style={{ color: "var(--color-brand-primary)" }}
          >
            <ArrowLeft size={14} />
            設定に戻る
          </Link>
        </motion.div>

        {/* プロフィールカード */}
        <motion.div variants={PAGE_ITEM_VARIANTS}>
          <div
            className="overflow-hidden rounded-2xl border p-6"
            style={{
              background: "var(--color-surface-default)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white"
                style={{
                  background: "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-deep))",
                  boxShadow: "0 2px 8px rgba(241,136,64,0.28)",
                }}
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[16px] font-extrabold leading-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  {userName}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <User size={12} style={{ color: "var(--foreground)", opacity: 0.4 }} />
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "var(--foreground)", opacity: 0.4 }}
                  >
                    ユーザーID
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* アクション */}
        <motion.div variants={PAGE_ITEM_VARIANTS} className="mt-4">
          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              background: "var(--color-surface-default)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <form action={logoutAction}>
              <motion.button
                type="submit"
                className="flex w-full items-center gap-3 px-5 py-4 text-[13px] font-bold"
                style={{ color: "var(--color-danger)" }}
                whileTap={{ scale: 0.98 }}
                transition={SPRING.snap}
              >
                <LogOut size={16} />
                ログアウト
              </motion.button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
