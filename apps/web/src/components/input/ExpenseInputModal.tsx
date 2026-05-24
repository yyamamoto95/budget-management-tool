"use client";

import { useState, useTransition, type ElementType } from "react";
import {
  ShoppingBasket, Utensils, Car, Zap, Smartphone,
  Heart, ShoppingBag, Music, Tag,
  Banknote, Gift, Briefcase, TrendingUp,
  Delete, PenLine, X, Check, ChevronDown, Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calcExpenseImpact } from "@budget/common";
import { createExpenseAction } from "@/lib/actions/expense";
import type { ExpenseActionState } from "@/lib/actions/expense";
import { SPRING } from "@/lib/motion";

type Cat = { id: number; key: string; name: string; color: string; bg: string; Icon: ElementType };

const EXPENSE_CATS: Cat[] = [
  { id: 1, key: "food",      name: "食費",   color: "#f18840", bg: "#fef5ee", Icon: ShoppingBasket },
  { id: 2, key: "dining",    name: "外食",   color: "#fb923c", bg: "#fff4ee", Icon: Utensils       },
  { id: 3, key: "transport", name: "交通費", color: "#60a5fa", bg: "#eff6ff", Icon: Car            },
  { id: 4, key: "daily",     name: "日用品", color: "#38bdf8", bg: "#f0f9ff", Icon: ShoppingBag    },
  { id: 5, key: "utility",   name: "光熱費", color: "#fbbf24", bg: "#fffbeb", Icon: Zap            },
  { id: 6, key: "telecom",   name: "通信費", color: "#818cf8", bg: "#eef2ff", Icon: Smartphone     },
  { id: 7, key: "medical",   name: "医療費", color: "#fb7185", bg: "#fff1f2", Icon: Heart          },
  { id: 8, key: "leisure",   name: "趣味",   color: "#c084fc", bg: "#faf5ff", Icon: Music          },
  { id: 9, key: "other",     name: "その他", color: "#94a3b8", bg: "#f8fafc", Icon: Tag            },
];

const INCOME_CATS: Cat[] = [
  { id: 17, key: "salary",     name: "給料",      color: "#2dd4bf", bg: "#f0fdfa", Icon: Banknote   },
  { id: 18, key: "bonus",      name: "賞与",      color: "#10b981", bg: "#ecfdf5", Icon: Gift       },
  { id: 19, key: "sideJob",    name: "副業",      color: "#22c55e", bg: "#f0fdf4", Icon: Briefcase  },
  { id: 20, key: "investment", name: "投資・配当", color: "#34d399", bg: "#ecfdf5", Icon: TrendingUp },
  { id: 21, key: "other",      name: "その他",    color: "#94a3b8", bg: "#f8fafc", Icon: Tag        },
];

const VISIBLE_COUNT = 4;
const today = () => new Date().toISOString().slice(0, 10);
const INITIAL_STATE: ExpenseActionState = { error: null, success: false };

interface Props {
  userId: string;
  minutesPerYen: number;
  onClose: () => void;
}

export function ExpenseInputModal({ userId, minutesPerYen, onClose }: Props) {
  const [balanceType, setBalanceType] = useState<0 | 1>(0);
  const [amountStr, setAmountStr] = useState("");
  const [categoryId, setCategoryId] = useState(EXPENSE_CATS[0].id);
  const [memo, setMemo] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const cats = balanceType === 0 ? EXPENSE_CATS : INCOME_CATS;
  const visible = showAll ? cats : cats.slice(0, VISIBLE_COUNT);
  const rest = cats.slice(VISIBLE_COUNT);

  const numAmount = amountStr === "" ? 0 : Number(amountStr);
  const impact =
    balanceType === 0 && numAmount > 0 && minutesPerYen > 0
      ? calcExpenseImpact(numAmount, minutesPerYen)
      : null;

  function handleNumKey(k: string) {
    if (k === "⌫") {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    setAmountStr((prev) => {
      if (prev === "" && (k === "0" || k === "000")) return prev;
      const next = prev + k;
      if (Number(next) > 9_999_999) return prev;
      return next;
    });
  }

  function handleTypeChange(t: 0 | 1) {
    setBalanceType(t);
    const nextCats = t === 0 ? EXPENSE_CATS : INCOME_CATS;
    setCategoryId(nextCats[0].id);
    setShowAll(false);
  }

  function handleSubmit() {
    if (numAmount <= 0) return;
    const fd = new FormData();
    fd.append("userId", userId);
    fd.append("amount", String(numAmount));
    fd.append("balanceType", String(balanceType));
    fd.append("categoryId", String(categoryId));
    fd.append("date", today());
    if (memo) fd.append("memo", memo);

    startTransition(async () => {
      await createExpenseAction(INITIAL_STATE, fd);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 800);
    });
  }

  const brandColor = balanceType === 0 ? "#e07236" : "#27a08f";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.40)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={SPRING.base}
        className="w-full max-w-lg overflow-y-auto rounded-t-2xl bg-[#fffdf5] p-5 shadow-2xl sm:rounded-2xl"
        style={{ maxHeight: "94dvh" }}
      >
        {/* ヘッダー */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-extrabold" style={{ color: "#1c1410" }}>
            支出・収入を記録
          </h2>
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.87 }}
            transition={SPRING.snap}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: "rgba(28,20,16,0.07)", color: "rgba(28,20,16,0.45)" }}
          >
            <X size={15} />
          </motion.button>
        </div>

        {/* セグメントコントロール */}
        <div className="mb-4">
          <div
            role="tablist"
            aria-label="収支タイプ選択"
            className="flex p-1"
            style={{ borderRadius: "10px", background: "rgba(28,20,16,0.06)" }}
          >
            {([0, 1] as const).map((t) => (
              <motion.button
                key={t}
                type="button"
                role="tab"
                aria-selected={balanceType === t}
                onClick={() => handleTypeChange(t)}
                whileTap={{ scale: 0.97 }}
                transition={SPRING.snap}
                className="relative flex-1 py-2 text-sm font-bold"
                style={{ borderRadius: "10px", zIndex: 1 }}
              >
                {balanceType === t && (
                  <motion.div
                    layoutId="modal-tab-bg"
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
        </div>

        {/* モバイル: 縦積み / デスクトップ: 2カラム */}
        <div className="sm:grid sm:grid-cols-2 sm:gap-4">
          {/* 左: 金額表示 + テンキー */}
          <div className="mb-4 space-y-3 sm:mb-0">
            {/* AmountPanel */}
            <div
              className="relative overflow-hidden rounded-xl px-4 py-3"
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
                  data-testid="amount-display"
                  className="text-3xl font-black tabular-nums"
                  style={{ color: brandColor, letterSpacing: "-0.03em" }}
                >
                  {amountStr === "" ? "0" : Number(amountStr).toLocaleString("ja-JP")}
                </span>
              </div>
              {impact && (
                <div
                  className="mt-1 text-[11px]"
                  style={{ color: "rgba(28,20,16,0.45)" }}
                >
                  家計への影響:{" "}
                  <span className="font-bold" style={{ color: "#1c1410" }}>
                    {impact.label}
                  </span>
                </div>
              )}
              <AnimatePresence>
                {amountStr && (
                  <motion.button
                    type="button"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileTap={{ scale: 0.8 }}
                    transition={SPRING.snap}
                    onClick={() => setAmountStr("")}
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "rgba(28,20,16,0.10)", color: "rgba(28,20,16,0.45)" }}
                    aria-label="クリア"
                  >
                    <X size={12} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-1.5">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "⌫"].map((k) => (
                <motion.button
                  key={k}
                  type="button"
                  onClick={() => handleNumKey(k)}
                  whileTap={{ scale: 0.84 }}
                  transition={SPRING.snap}
                  aria-label={k === "⌫" ? "1文字削除" : undefined}
                  className="flex h-10 items-center justify-center select-none text-base font-semibold"
                  style={{
                    borderRadius: "10px",
                    background: k === "⌫" ? "#fff0ea" : "#fffdf5",
                    color: k === "⌫" ? "#f18840" : "#1c1410",
                    border: "1px solid rgba(28,20,16,0.10)",
                    boxShadow: "0 1px 3px rgba(28,20,16,0.06)",
                  }}
                >
                  {k === "⌫" ? <Delete size={17} aria-hidden /> : k}
                </motion.button>
              ))}
            </div>
          </div>

          {/* 右: カテゴリ + メモ + 記録ボタン */}
          <div className="flex flex-col gap-3">
            {/* CategoryGrid */}
            <div
              className="rounded-xl p-3"
              style={{ border: "1px solid rgba(28,20,16,0.10)", background: "#fffdf5" }}
            >
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
                      const Icon = cat.Icon;
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
                              layoutId="cat-modal-bg"
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

            {/* メモ */}
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
                className="h-9 w-full px-3 text-sm outline-none transition-colors"
                style={{
                  border: `1.5px solid ${memo ? "#f18840" : "rgba(28,20,16,0.10)"}`,
                  borderRadius: "12px",
                  background: memo ? "#fff3e8" : "#fffdf5",
                  color: "#1c1410",
                }}
                placeholder="店名・用途など"
                aria-label="メモ"
              />
            </div>

            {/* 記録ボタン */}
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={SPRING.quick}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #35b5a2, #27a08f)" }}
                >
                  <Check size={16} strokeWidth={2.5} />
                  記録しました！
                </motion.div>
              ) : (
                <motion.button
                  key="submit"
                  type="button"
                  onClick={handleSubmit}
                  disabled={numAmount <= 0 || isPending}
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING.snap}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white disabled:opacity-40"
                  style={(() => {
                    if (!numAmount) return { background: "rgba(28,20,16,0.14)", boxShadow: "none", transition: "background 0.2s, box-shadow 0.2s" };
                    if (balanceType === 0) return { background: "linear-gradient(135deg, #f18840, #e07236)", boxShadow: "0 4px 16px rgba(241,136,64,0.28)", transition: "background 0.2s, box-shadow 0.2s" };
                    return { background: "linear-gradient(135deg, #35b5a2, #27a08f)", boxShadow: "0 4px 16px rgba(53,181,162,0.24)", transition: "background 0.2s, box-shadow 0.2s" };
                  })()}
                >
                  {isPending ? (
                    "記録中..."
                  ) : (
                    <>
                      <Receipt size={15} />
                      記録する
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
