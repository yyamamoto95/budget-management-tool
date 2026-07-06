"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PiggyBank, Settings } from "lucide-react";
import { calculateLivingMargin, type LivingMarginInputs } from "@budget/common";
import { SPRING } from "@/lib/motion";

type Props = {
  livingMargin: LivingMarginInputs;
};

/** カードの共通シェル（他ダッシュボードカードと同じトーン） */
function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      data-testid="living-margin-card"
      className="overflow-hidden rounded-2xl border p-4"
      style={{
        background: "var(--color-surface-default)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
          生活余力
        </span>
        <PiggyBank size={14} aria-hidden style={{ color: "var(--foreground)", opacity: 0.42 }} />
      </div>
      {children}
    </motion.div>
  );
}

/** 増減傾向の表示文言と色を決める（事実のみのトーン。spec: core-spec.md ②表示ルール） */
function getTrendDisplay(
  increasing: boolean,
  monthlyDeltaMonths: number
): { trendLabel: string; trendColor: string } {
  if (increasing) {
    return { trendLabel: "余力は増加中", trendColor: "var(--color-income)" };
  }
  // 減少幅が丸めて 0.0 になる場合は「ほぼ横ばい」として扱う（「0.0ヶ月分ずつ減少」を避ける）
  const roundedDelta = Math.abs(monthlyDeltaMonths).toFixed(1);
  if (roundedDelta === "0.0") {
    return { trendLabel: "余力はほぼ横ばい", trendColor: "var(--foreground)" };
  }
  return {
    trendLabel: `今のペースでは毎月約${roundedDelta}ヶ月分ずつ減少`,
    trendColor: "var(--color-caution)",
  };
}

/**
 * 生活余力カード（spec: core-spec.md ①②）
 * 「今の資産で生活費あと何ヶ月分か」を数字主役・事実のみのトーンで表示する。
 * 算出不能の場合は理由と次のアクション（設定・記録）を案内する。
 */
export function LivingMarginCard({ livingMargin }: Props) {
  const result = calculateLivingMargin(livingMargin);

  // 総資産未設定: 設定への導線を表示する
  if (result.status === "no-assets") {
    return (
      <CardShell>
        <p className="text-sm" style={{ color: "var(--foreground)", opacity: 0.6 }}>
          総資産を設定すると、今の資産で生活費あと何ヶ月分をまかなえるかが表示されます。
        </p>
        <Link
          href="/settings"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--foreground)",
          }}
        >
          <Settings size={12} aria-hidden />
          総資産を設定する
        </Link>
      </CardShell>
    );
  }

  // 記録不足: 記録が溜まると表示されることを案内する
  if (result.status === "no-expense-data" || result.status === "insufficient-data") {
    return (
      <CardShell>
        <p className="text-sm" style={{ color: "var(--foreground)", opacity: 0.6 }}>
          {result.status === "no-expense-data"
            ? "支出の記録が溜まると表示されます。まずは今日の支出を記録してみましょう。"
            : "支出の記録が7日分溜まると表示されます。"}
        </p>
      </CardShell>
    );
  }

  const { trendLabel, trendColor } = getTrendDisplay(
    result.increasing,
    result.monthlyDeltaMonths
  );

  return (
    <CardShell>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)", opacity: 0.6 }}>
          生活費
        </span>
        <span
          className="text-3xl font-black tabular-nums"
          style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
        >
          {result.reserveMonths.toFixed(1)}
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)", opacity: 0.6 }}>
          ヶ月分
        </span>
      </div>
      <p className="mt-1.5 text-xs font-semibold" style={{ color: trendColor }}>
        {trendLabel}
      </p>
    </CardShell>
  );
}
