"use client";

import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { SPRING } from "@/lib/motion";

type Tone = "safe" | "caution" | "danger";

type Props = {
  dailyBudget: number;
  daysUntilPayday: number;
  tone: Tone;
  onQuickEntry: () => void;
};

export function EmptyState({ dailyBudget, daysUntilPayday, tone, onQuickEntry }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.base}
      className="flex flex-col items-center gap-6 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
        className="flex h-16 w-16 items-center justify-center rounded-xl"
        style={{
          background: "var(--color-brand-light)",
          boxShadow: "0 4px 20px rgba(241,136,64,0.16)",
        }}
      >
        <Sparkles size={28} style={{ color: "var(--color-brand-primary)" }} />
      </motion.div>

      <div>
        <h2
          className="text-xl font-extrabold"
          style={{ color: "var(--foreground)" }}
        >
          初回設定が完了しました！
        </h2>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--foreground)", opacity: 0.42 }}
        >
          あなたの1日予算が計算されました
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.base, delay: 0.2 }}
        className="w-full max-w-xs rounded-xl border-2 p-6 text-center"
        style={{
          background: `var(--color-status-${tone}-bg)`,
          borderColor: `var(--color-status-${tone}-border)`,
        }}
      >
        <p
          className="mb-1 text-xs font-semibold"
          style={{ color: "var(--foreground)", opacity: 0.42 }}
        >
          今日使えるお金
        </p>
        <p
          className="text-4xl font-black"
          style={{
            color: `var(--color-status-${tone}-hero)`,
            letterSpacing: "-0.03em",
          }}
        >
          &yen;{dailyBudget.toLocaleString()}
        </p>
        <p
          className="mt-2 text-xs"
          style={{ color: "var(--foreground)", opacity: 0.42 }}
        >
          給料日まで あと {daysUntilPayday} 日
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...SPRING.base, delay: 0.35 }}
        className="text-sm"
        style={{ color: "var(--foreground)", opacity: 0.42 }}
      >
        最初の支出を記録してみましょう
      </motion.p>

      <motion.button
        type="button"
        onClick={onQuickEntry}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.base, delay: 0.45 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white"
        style={{
          background: "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-deep))",
          borderRadius: "9999px",
          boxShadow: "0 4px 20px rgba(241,136,64,0.32)",
        }}
      >
        <Plus size={18} strokeWidth={2.5} />
        最初の支出を記録する
      </motion.button>
    </motion.div>
  );
}
