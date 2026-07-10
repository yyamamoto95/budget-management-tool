"use client";

import { motion } from "framer-motion";
import { ExternalLink, TrendingUp } from "lucide-react";
import {
  buildInvestmentDeepLinkQuery,
  calculateInvestmentCapacity,
  emergencyFundDisplay,
  formatCapacityHoldReason,
  formatYen,
  INVESTMENT_CAPACITY_TEXT,
  RISK_TOLERANCE_LABELS,
  type LivingMarginInputs,
} from "@budget/common";
import { SPRING } from "@/lib/motion";

type Props = {
  livingMargin: LivingMarginInputs;
};

/** 検証ツール（investment-analysis-tool）のベース URL。未設定時は CTA を表示しない */
const INVESTMENT_TOOL_URL = process.env.NEXT_PUBLIC_INVESTMENT_TOOL_URL;

/**
 * 投資余力カード（spec: investment-business-basics.md MVP スコープ 1 / #543 #545）
 * 「今月投資に回してよい上限」を数字主役・事実のみのトーンで表示する。
 * 「今月は投資を控える月」も正しい結果として肯定形で表示する（急かさない・煽らない）。
 * 算出不能（総資産未設定・記録不足）のときは生活余力カード側が案内するため何も表示しない。
 */
export function InvestmentCapacityCard({ livingMargin }: Props) {
  const result = calculateInvestmentCapacity(livingMargin);
  if (result.status !== "ok") {
    return null;
  }

  const fund = emergencyFundDisplay(result.emergencyFundRatio);
  const holdReason = formatCapacityHoldReason(result);
  const deepLinkQuery = buildInvestmentDeepLinkQuery(result);
  const ctaHref =
    deepLinkQuery && INVESTMENT_TOOL_URL
      ? `${INVESTMENT_TOOL_URL.replace(/\/$/, "")}/?${deepLinkQuery}`
      : null;

  return (
    <motion.div
      data-testid="investment-capacity-card"
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
          {INVESTMENT_CAPACITY_TEXT.title}
        </span>
        <TrendingUp size={14} aria-hidden style={{ color: "var(--foreground)", opacity: 0.42 }} />
      </div>

      {result.shouldHold ? (
        <>
          <p className="text-lg font-black" style={{ color: "var(--foreground)" }}>
            {INVESTMENT_CAPACITY_TEXT.holdTitle}
          </p>
          <p
            className="mt-1.5 text-xs leading-relaxed"
            style={{ color: "var(--foreground)", opacity: 0.6 }}
          >
            {holdReason}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)", opacity: 0.6 }}
            >
              {INVESTMENT_CAPACITY_TEXT.limitLabel}
            </span>
            <span
              className="text-3xl font-black tabular-nums"
              style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
            >
              {formatYen(result.monthlyLimitJpy)}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-semibold" style={{ color: "var(--color-income)" }}>
            リスク許容度: {RISK_TOLERANCE_LABELS[result.riskTolerance]}
          </p>
        </>
      )}

      {/* 生活防衛資金の充足バー（事実のみ。良好=income / 未充足=caution） */}
      <div className="mt-3">
        <div
          className="flex items-center justify-between text-[11px]"
          style={{ color: "var(--foreground)", opacity: 0.5 }}
        >
          <span>{INVESTMENT_CAPACITY_TEXT.fundLabel}</span>
          <span className="tabular-nums">{fund.percent}%</span>
        </div>
        <div
          className="mt-1 h-1.5 overflow-hidden rounded-full"
          style={{ background: "var(--border-default)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${fund.barPercent}%`,
              background:
                result.emergencyFundRatio >= 1.0
                  ? "var(--color-income)"
                  : "var(--color-caution)",
            }}
          />
        </div>
      </div>

      {ctaHref && (
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--foreground)",
            background: "var(--color-surface-subtle)",
          }}
        >
          <ExternalLink size={12} aria-hidden />
          {INVESTMENT_CAPACITY_TEXT.ctaLabel}
        </a>
      )}

      <p
        className="mt-3 text-[10px] leading-relaxed"
        style={{ color: "var(--foreground)", opacity: 0.5 }}
      >
        {INVESTMENT_CAPACITY_TEXT.disclaimer}
      </p>
    </motion.div>
  );
}
