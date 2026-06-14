"use client";

import { motion } from "framer-motion";
import { SPRING } from "@/lib/motion";

export type Period = "week" | "month" | "lastMonth" | "all";

const PERIOD_ORDER: Period[] = ["week", "month", "lastMonth", "all"];
const PERIOD_LABELS: Record<Period, string> = {
	week: "今週",
	month: "今月",
	lastMonth: "先月",
	all: "すべて",
};

type PeriodTabsProps = {
	value: Period;
	onChange: (period: Period) => void;
	/** sticky 配置時に半透過背景を有効化 */
	sticky?: boolean;
};

/**
 * 期間フィルタタブ（Report / Records 共用）
 */
export function PeriodTabs({ value, onChange, sticky }: PeriodTabsProps) {
	return (
		<div
			className="flex gap-1 overflow-x-auto"
			style={
				sticky
					? {
							position: "sticky",
							top: 0,
							zIndex: 10,
							background: "rgba(255,253,245,0.96)",
							backdropFilter: "blur(10px)",
							padding: "8px 0",
						}
					: undefined
			}
		>
			{PERIOD_ORDER.map((p) => (
				<motion.button
					key={p}
					type="button"
					className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
					style={{
						background: p === value ? "#f18840" : "#f5f3ef",
						color: p === value ? "#fff" : "rgba(28,20,16,0.45)",
					}}
					whileTap={{ scale: 0.93 }}
					transition={SPRING.snap}
					onClick={() => onChange(p)}
				>
					{PERIOD_LABELS[p]}
				</motion.button>
			))}
		</div>
	);
}
