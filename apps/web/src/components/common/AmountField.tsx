"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { SPRING } from "@/lib/motion";

type AmountFieldProps = {
	value: number;
	onChange: (v: number) => void;
	step?: number;
	suffix?: string;
	min?: number;
	max?: number;
};

/**
 * ±ステッパー付き金額入力フィールド
 * Settings / Setup 共用
 */
export function AmountField({
	value,
	onChange,
	step = 1000,
	suffix,
	min = 0,
	max,
}: AmountFieldProps) {
	const [focused, setFocused] = useState(false);
	const [raw, setRaw] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFocus = useCallback(() => {
		setFocused(true);
		setRaw(value === 0 ? "" : String(value));
	}, [value]);

	const handleBlur = useCallback(() => {
		setFocused(false);
		const parsed = Number.parseInt(raw, 10);
		if (!Number.isNaN(parsed)) {
			const clamped = Math.max(min, max != null ? Math.min(parsed, max) : parsed);
			onChange(clamped);
		}
	}, [raw, onChange, min, max]);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setRaw(e.target.value.replace(/[^0-9]/g, ""));
	}, []);

	const adjust = useCallback(
		(delta: number) => {
			const next = Math.max(min, max != null ? Math.min(value + delta, max) : value + delta);
			onChange(next);
			if (focused) setRaw(String(next));
		},
		[value, onChange, min, max, focused],
	);

	return (
		<div className="flex items-center gap-1">
			<motion.button
				type="button"
				className="flex h-9 w-9 items-center justify-center rounded-md"
				style={{ background: "#f5f3ef", color: "rgba(28,20,16,0.45)" }}
				whileTap={{ scale: 0.85 }}
				transition={SPRING.snap}
				onMouseDown={(e) => e.preventDefault()}
				onClick={() => adjust(-step)}
				disabled={value <= min}
			>
				<Minus size={16} />
			</motion.button>

			<div
				className="relative flex flex-1 items-center rounded-lg border px-3 py-2 transition-colors"
				style={{
					borderColor: focused ? "#f18840" : "rgba(28,20,16,0.08)",
					background: focused ? "#fff6ee" : "#ffffff",
				}}
			>
				<span className="mr-1 text-xs" style={{ color: "rgba(28,20,16,0.45)" }}>
					&yen;
				</span>
				<input
					ref={inputRef}
					type="text"
					inputMode="numeric"
					className="w-full bg-transparent text-right font-bold tabular-nums outline-none"
					style={{ color: "#1c1410" }}
					value={focused ? raw : value.toLocaleString()}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onChange={handleChange}
				/>
				{suffix && (
					<span className="ml-1 text-xs" style={{ color: "rgba(28,20,16,0.45)" }}>
						{suffix}
					</span>
				)}
			</div>

			<motion.button
				type="button"
				className="flex h-9 w-9 items-center justify-center rounded-md"
				style={{ background: "#f5f3ef", color: "rgba(28,20,16,0.45)" }}
				whileTap={{ scale: 0.85 }}
				transition={SPRING.snap}
				onMouseDown={(e) => e.preventDefault()}
				onClick={() => adjust(step)}
				disabled={max != null && value >= max}
			>
				<Plus size={16} />
			</motion.button>
		</div>
	);
}
