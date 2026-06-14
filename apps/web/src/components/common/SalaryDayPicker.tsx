"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SPRING } from "@/lib/motion";

const COMMON_DAYS = [1, 5, 10, 15, 20, 21, 25, 28, 31];
const COMMON_SET = new Set(COMMON_DAYS);
const ALL_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

type SalaryDayPickerProps = {
	value: number;
	onChange: (v: number) => void;
};

/**
 * 給料日ピッカー: よくある日チップ + 1-31 グリッドドロップダウン
 * Settings / Setup 共用
 */
export function SalaryDayPicker({ value, onChange }: SalaryDayPickerProps) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const pickerRef = useRef<HTMLDivElement>(null);

	// 外側クリックで閉じる
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			const target = e.target as Node;
			if (triggerRef.current?.contains(target) || pickerRef.current?.contains(target)) return;
			setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	const select = useCallback(
		(day: number) => {
			onChange(day);
			setOpen(false);
		},
		[onChange],
	);

	return (
		<div className="flex flex-col gap-2">
			{/* よくある日チップ */}
			<div className="flex gap-1 overflow-x-auto">
				{COMMON_DAYS.map((d) => (
					<motion.button
						key={d}
						type="button"
						className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
						style={{
							background: d === value ? "#f18840" : "#f5f3ef",
							color: d === value ? "#ffffff" : "#1c1410",
							boxShadow: d === value ? "0 2px 8px rgba(241,136,64,0.3)" : "none",
						}}
						whileTap={{ scale: 0.88 }}
						transition={SPRING.snap}
						onClick={() => select(d)}
					>
						{d}日
					</motion.button>
				))}
			</div>

			{/* グリッドドロップダウントリガー */}
			<div className="relative">
				<motion.button
					ref={triggerRef}
					type="button"
					className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold"
					style={{
						borderColor: open ? "#f18840" : "rgba(28,20,16,0.08)",
						minWidth: 58,
					}}
					whileTap={{ scale: 0.95 }}
					transition={SPRING.snap}
					onClick={() => setOpen((p) => !p)}
				>
					{value}日
					<ChevronDown size={14} style={{ color: "rgba(28,20,16,0.45)" }} />
				</motion.button>

				<AnimatePresence>
					{open && (
						<motion.div
							ref={pickerRef}
							className="absolute left-0 top-full z-50 mt-1.5 rounded-xl bg-white p-2 shadow-lg"
							style={{
								border: "1px solid rgba(28,20,16,0.08)",
								boxShadow: "0 8px 32px rgba(28,20,16,0.12)",
							}}
							initial={{ opacity: 0, scale: 0.94, y: -6 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.94, y: -6 }}
							transition={SPRING.quick}
						>
							<div className="grid grid-cols-7 gap-0.5">
								{ALL_DAYS.map((d) => {
									const isSelected = d === value;
									let bg = "transparent";
									if (isSelected) bg = "#f18840";
									else if (COMMON_SET.has(d)) bg = "rgba(241,136,64,0.08)";
									return (
									<motion.button
										key={d}
										type="button"
										className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold"
										style={{
											background: bg,
											color: isSelected ? "#ffffff" : "#1c1410",
										}}
										whileTap={{ scale: 0.82 }}
										transition={SPRING.snap}
										onClick={() => select(d)}
									>
										{d}
									</motion.button>
									);
								})}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
