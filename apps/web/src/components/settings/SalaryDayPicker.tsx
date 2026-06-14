"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { SPRING } from "@/lib/motion";

const COMMON_DAYS = [1, 5, 10, 15, 20, 21, 25, 28, 31] as const;
const DAY_CELLS = Array.from({ length: 35 }, (_, i) => (i < 31 ? i + 1 : null));

type Props = {
  value: number;
  onChange: (v: number) => void;
};

export function SalaryDayPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // クリック外で閉じる + Escape キーで閉じる
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleToggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  }

  const prevCommon = COMMON_DAYS.filter((d) => d < value);
  const nextCommon = COMMON_DAYS.filter((d) => d > value);
  const canPrev = prevCommon.length > 0;
  const canNext = nextCommon.length > 0;

  function isCommonDay(d: number): boolean {
    return (COMMON_DAYS as readonly number[]).includes(d);
  }

  function getDayCellBg(d: number, selected: number): string {
    if (d === selected) return "var(--color-brand-primary)";
    if (isCommonDay(d)) return "rgba(241,136,64,0.08)";
    return "transparent";
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 行1: ラベル + よくある日チップ */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: "var(--color-surface-subtle)" }}
        >
          <Calendar size={14} style={{ color: "var(--color-brand-primary)" }} />
        </div>
        <span
          className="shrink-0 text-xs font-medium"
          style={{ color: "var(--foreground)", opacity: 0.72 }}
        >
          給料日
        </span>
        <div className="flex flex-1 items-center justify-end gap-1.5 overflow-x-auto">
          {COMMON_DAYS.map((d) => (
            <motion.button
              key={d}
              type="button"
              className="h-9 w-9 shrink-0 rounded-md text-sm font-bold"
              style={{
                background: value === d ? "var(--color-brand-primary)" : "var(--color-surface-subtle)",
                color: value === d ? "#ffffff" : "var(--foreground)",
                boxShadow: value === d ? "0 3px 8px rgba(241,136,64,0.4)" : "none",
              }}
              onClick={() => onChange(d)}
              whileTap={{ scale: 0.88 }}
              transition={SPRING.snap}
              aria-pressed={value === d}
            >
              {d}
            </motion.button>
          ))}
          <span
            className="ml-0.5 shrink-0 text-xs"
            style={{ color: "var(--foreground)", opacity: 0.45 }}
          >
            日
          </span>
        </div>
      </div>

      {/* 行2: 任意の日付ピッカー */}
      <div className="flex items-center justify-end gap-1.5">
        <span
          className="shrink-0 text-[11px] font-medium"
          style={{ color: "var(--foreground)", opacity: 0.45 }}
        >
          他の日付
        </span>
        <div ref={pickerRef} className="flex shrink-0 items-center gap-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.82 }}
            transition={SPRING.snap}
            onClick={() => canPrev && onChange(prevCommon[prevCommon.length - 1])}
            disabled={!canPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{
              background: "var(--color-surface-subtle)",
              color: canPrev ? "var(--foreground)" : "var(--border-default)",
            }}
            aria-label="前のよくある給料日"
          >
            <ChevronLeft size={14} />
          </motion.button>

          <button
            ref={triggerRef}
            type="button"
            onClick={handleToggle}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-bold tabular-nums"
            style={{
              background: open ? "var(--color-brand-light)" : "var(--color-surface-subtle)",
              border: `1.5px solid ${open ? "var(--color-brand-primary)" : "transparent"}`,
              color: open ? "var(--color-brand-primary)" : "var(--foreground)",
              minWidth: 58,
              justifyContent: "center",
            }}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {value}日
            <ChevronDown
              size={11}
              style={{
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
                opacity: 0.5,
              }}
            />
          </button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.82 }}
            transition={SPRING.snap}
            onClick={() => canNext && onChange(nextCommon[0])}
            disabled={!canNext}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{
              background: "var(--color-surface-subtle)",
              color: canNext ? "var(--foreground)" : "var(--border-default)",
            }}
            aria-label="次のよくある給料日"
          >
            <ChevronRight size={14} />
          </motion.button>

          {/* 1〜31 グリッド */}
          <AnimatePresence>
            {open && (
              <motion.div
                style={{
                  position: "fixed",
                  top: pos.top,
                  right: pos.right,
                  zIndex: 9999,
                  background: "var(--color-surface-default)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 8px 24px rgba(28,20,16,0.14)",
                  minWidth: 228,
                  borderRadius: 16,
                  padding: 8,
                }}
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={SPRING.snap}
                role="listbox"
                aria-label="給料日を選択"
              >
                <p
                  className="px-1 pb-1.5 text-[10px] font-bold"
                  style={{ color: "var(--foreground)", opacity: 0.3 }}
                >
                  日付を選択（1〜31日）
                </p>
                <div className="grid grid-cols-7 gap-0.5">
                  {DAY_CELLS.map((d, i) =>
                    d === null ? (
                      <div key={`empty-${String(i)}`} className="h-8 w-8" />
                    ) : (
                      <motion.button
                        key={d}
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        transition={SPRING.snap}
                        onClick={() => {
                          onChange(d);
                          setOpen(false);
                        }}
                        role="option"
                        aria-selected={d === value}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[12px] font-bold transition-colors"
                        style={{
                          background: getDayCellBg(d, value),
                          color: d === value ? "#fff" : "var(--foreground)",
                        }}
                      >
                        {d}
                      </motion.button>
                    ),
                  )}
                </div>
                <div className="mt-2 flex items-center gap-1.5 px-1">
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ background: "rgba(241,136,64,0.15)" }}
                  />
                  <span
                    className="text-[9px] font-semibold"
                    style={{ color: "var(--foreground)", opacity: 0.3 }}
                  >
                    よくある給料日
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
