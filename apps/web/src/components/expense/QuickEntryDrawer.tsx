"use client";

import { useActionState, useState } from "react";
import {
  Delete, PenLine, ChevronDown, Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { createExpenseAction } from "@/lib/actions/expense";
import type { ExpenseActionState } from "@/lib/actions/expense";
import type { CategoryItem } from "@/lib/api/types";
import { getCategoryIcon } from "@/lib/categoryTokens";
import { SPRING } from "@/lib/motion";

type Props = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseCategories: CategoryItem[];
  incomeCategories: CategoryItem[];
};

const VISIBLE_COUNT = 4;
const MAX_AMOUNT = 9_999_999;
const initialState: ExpenseActionState = { error: null, success: false };

export function QuickEntryDrawer({
  userId,
  open,
  onOpenChange,
  expenseCategories,
  incomeCategories,
}: Props) {
  const [balanceType, setBalanceType] = useState<0 | 1>(0);
  const [categoryId, setCategoryId] = useState<number>(expenseCategories[0]?.id ?? 0);
  const [amountStr, setAmountStr] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [memo, setMemo] = useState("");
  const [date] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [state, formAction, isPending] = useActionState(createExpenseAction, initialState);

  const categories = balanceType === 0 ? expenseCategories : incomeCategories;
  const visible = showAll ? categories : categories.slice(0, VISIBLE_COUNT);
  const rest = categories.slice(VISIBLE_COUNT);
  const brandColor = balanceType === 0 ? "#e07236" : "#27a08f";

  function handleTypeChange(type: 0 | 1) {
    setBalanceType(type);
    const cats = type === 0 ? expenseCategories : incomeCategories;
    setCategoryId(cats[0]?.id ?? 0);
    setShowAll(false);
  }

  function handleNumKey(k: string) {
    if (k === "⌫") {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    setAmountStr((prev) => {
      if (prev === "" && (k === "0" || k === "000")) return prev;
      const next = prev + k;
      if (Number(next) > MAX_AMOUNT) return prev;
      return next;
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="flex flex-col rounded-t-3xl border-0 bg-[#fffdf5] outline-none"
        style={{ boxShadow: "0 -4px 32px rgba(28,20,16,0.16)", maxHeight: "92dvh" }}
        aria-describedby={undefined}
      >
        <DrawerTitle className="shrink-0 px-5 pb-1 pt-2 text-sm font-extrabold text-[#1c1410]">
          クイック記録
        </DrawerTitle>

        <form action={formAction} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-2 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]"
        >
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="balanceType" value={balanceType} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="amount" value={amountStr || "0"} />
          {memo && <input type="hidden" name="memo" value={memo} />}

          {/* 支出 / 収入 セグメントコントロール */}
          <div
            className="flex p-1"
            style={{ borderRadius: "10px", background: "rgba(28,20,16,0.06)" }}
          >
            {([0, 1] as const).map((t) => (
              <motion.button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                whileTap={{ scale: 0.97 }}
                transition={SPRING.snap}
                className="relative flex-1 py-2 text-sm font-bold"
                style={{ borderRadius: "10px", zIndex: 1 }}
              >
                {balanceType === t && (
                  <motion.div
                    layoutId="drawer-tab-bg"
                    className="absolute inset-0"
                    style={{
                      borderRadius: "10px",
                      background:
                        t === 0
                          ? "linear-gradient(135deg, #f18840, #e07236)"
                          : "linear-gradient(135deg, #35b5a2, #27a08f)",
                      boxShadow:
                        t === 0
                          ? "0 2px 10px rgba(241,136,64,0.28)"
                          : "0 2px 10px rgba(53,181,162,0.25)",
                    }}
                    transition={SPRING.base}
                  />
                )}
                <span
                  className="relative z-10"
                  style={{ color: balanceType === t ? "#fff" : "rgba(28,20,16,0.45)" }}
                >
                  {t === 0 ? "支出" : "収入"}
                </span>
              </motion.button>
            ))}
          </div>

          {/* 金額表示パネル */}
          <div
            className="relative shrink-0 rounded-xl px-4 py-3"
            style={{
              background:
                balanceType === 0
                  ? "linear-gradient(135deg, #fff3e8, #ffe8d6)"
                  : "linear-gradient(135deg, #edfaf7, #d4f5ef)",
              border: `1.5px solid ${balanceType === 0 ? "rgba(241,136,64,0.22)" : "rgba(53,181,162,0.22)"}`,
            }}
          >
            <div
              className="mb-1 text-[10px] font-semibold"
              style={{ color: "rgba(28,20,16,0.45)" }}
            >
              {balanceType === 0 ? "支出金額" : "収入金額"}
            </div>
            <div className="flex items-baseline gap-0.5">
              <span
                className="text-3xl font-black"
                style={{ color: brandColor, letterSpacing: "-0.03em" }}
              >
                ¥
              </span>
              <span
                className="text-3xl font-black tabular-nums"
                style={{ color: brandColor, letterSpacing: "-0.03em" }}
              >
                {amountStr === "" ? "0" : Number(amountStr).toLocaleString("ja-JP")}
              </span>
            </div>
          </div>

          {/* カテゴリグリッド */}
          <div>
            <div
              className="mb-2 text-[10px] font-semibold"
              style={{ color: "rgba(28,20,16,0.45)" }}
            >
              カテゴリ
              {!showAll && (
                <span
                  className="ml-1.5 text-[9px]"
                  style={{ color: "rgba(28,20,16,0.30)" }}
                >
                  よく使う順
                </span>
              )}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={balanceType}
                initial={{ opacity: 0, x: balanceType === 0 ? -6 : 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: balanceType === 0 ? 6 : -6 }}
                transition={{ duration: 0.12 }}
              >
                <div className="grid grid-cols-4 gap-1.5">
                  {visible.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    const Icon = getCategoryIcon(cat.key);
                    return (
                      <motion.button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        whileTap={{ scale: 0.88 }}
                        transition={SPRING.snap}
                        className="relative flex flex-col items-center gap-1 overflow-hidden py-2 text-[10px] font-semibold"
                        style={{ borderRadius: "10px" }}
                      >
                        {isSelected ? (
                          <motion.div
                            layoutId="cat-drawer-bg"
                            className="absolute inset-0"
                            style={{
                              borderRadius: "10px",
                              background: cat.bg,
                              border: `1.5px solid ${cat.color}40`,
                            }}
                            transition={SPRING.base}
                          />
                        ) : (
                          <div
                            className="absolute inset-0"
                            style={{
                              borderRadius: "10px",
                              background: "#fffdf5",
                              border: "1px solid rgba(28,20,16,0.10)",
                            }}
                          />
                        )}
                        <span className="relative z-10">
                          <Icon
                            size={16}
                            style={{
                              color: isSelected ? cat.color : "rgba(28,20,16,0.35)",
                            }}
                            aria-hidden
                          />
                        </span>
                        <span
                          className="relative z-10 text-center leading-tight"
                          style={{ color: isSelected ? cat.color : "rgba(28,20,16,0.55)" }}
                        >
                          {cat.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                {rest.length > 0 && (
                  <motion.button
                    type="button"
                    onClick={() => setShowAll(!showAll)}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING.snap}
                    aria-expanded={showAll}
                    className="mt-2 flex w-full items-center justify-center gap-1 py-1.5 text-[10px] font-semibold"
                    style={{
                      borderRadius: "10px",
                      background: "#fffdf5",
                      border: "1px solid rgba(28,20,16,0.10)",
                      color: "rgba(28,20,16,0.45)",
                    }}
                  >
                    <ChevronDown
                      size={11}
                      aria-hidden
                      style={{
                        transform: showAll ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    />
                    {showAll ? "折りたたむ" : `もっと見る（${rest.length}件）`}
                  </motion.button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* テンキー */}
          <div className="grid grid-cols-3 gap-1.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "⌫"].map((k) => (
              <motion.button
                key={k}
                type="button"
                onClick={() => handleNumKey(k)}
                whileTap={{ scale: 0.84 }}
                transition={SPRING.snap}
                aria-label={k === "⌫" ? "1文字削除" : undefined}
                className="flex h-11 items-center justify-center select-none text-base font-semibold"
                style={{
                  borderRadius: "10px",
                  background: k === "⌫" ? "#fff0ea" : "#fffdf5",
                  color: k === "⌫" ? "#f18840" : "#1c1410",
                  border: "1px solid rgba(28,20,16,0.10)",
                  boxShadow: "0 1px 3px rgba(28,20,16,0.06)",
                }}
              >
                {k === "⌫" ? <Delete size={18} aria-hidden /> : k}
              </motion.button>
            ))}
          </div>

          {/* メモ（任意） */}
          <div>
            <div
              className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: "rgba(28,20,16,0.45)" }}
            >
              <PenLine size={10} />
              メモ（任意）
            </div>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="h-10 w-full px-3 text-sm outline-none transition-colors"
              style={{
                fontSize: "16px",
                border: `1.5px solid ${memo ? "#f18840" : "rgba(28,20,16,0.10)"}`,
                borderRadius: "12px",
                background: memo ? "#fff3e8" : "#fffdf5",
                color: "#1c1410",
              }}
              placeholder="店名・用途など"
              aria-label="メモ"
            />
          </div>

          {/* エラー / 成功 */}
          {state.error && (
            <p className="rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#1c1410]">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-xl border border-[#4caf82]/40 bg-[#f0fdf6] px-3 py-2 text-sm font-bold text-[#4caf82]">
              登録しました
            </p>
          )}

          {/* 記録する */}
          <button
            type="submit"
            disabled={isPending || !amountStr}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-extrabold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "var(--color-brand-primary)" }}
          >
            {isPending ? (
              "登録中..."
            ) : (
              <>
                <Receipt size={16} />
                記録する
              </>
            )}
          </button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
