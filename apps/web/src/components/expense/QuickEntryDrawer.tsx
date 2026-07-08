"use client";

import { useActionState, useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Delete, PenLine, ChevronDown, Receipt, Check, Camera, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { formatLivingMarginImpact } from "@budget/common";
import { toast } from "sonner";
import { createExpenseAction } from "@/lib/actions/expense";
import { scanReceiptAction } from "@/lib/actions/receipt";
import type { ExpenseActionState } from "@/lib/actions/expense";
import type { DailyBudgetSnapshot } from "@/components/providers/LivingMarginProvider";
import type { CategoryItem } from "@/lib/api/types";
import { getCategoryIcon } from "@/lib/categoryTokens";
import { SPRING } from "@/lib/motion";

type Props = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseCategories: CategoryItem[];
  incomeCategories: CategoryItem[];
  /** 実効日次支出 E（円/日）。生活余力の即時フィードバックに使用（算出不能時は null / 未指定） */
  effectiveDailyExpense?: number | null;
  /** 1日予算と今日の残額。「記録後の残り」プレビューに使用（未取得時は null / 未指定） */
  dailyBudget?: DailyBudgetSnapshot | null;
};

const VISIBLE_COUNT = 4;
const MAX_AMOUNT = 9_999_999;
/** 成功フィードバック（✓ 記録しました！）の表示時間（ms） */
const SUCCESS_FEEDBACK_MS = 1600;
/** 「記録後の残り」を警告色にする閾値（1日予算に対する残額の比率） */
const REMAINING_WARN_RATIO = 0.2;
const initialState: ExpenseActionState = { error: null, success: false };

export function QuickEntryDrawer({
  userId,
  open,
  onOpenChange,
  expenseCategories,
  incomeCategories,
  effectiveDailyExpense = null,
  dailyBudget = null,
}: Props) {
  const router = useRouter();
  const [balanceType, setBalanceType] = useState<0 | 1>(0);
  const [categoryId, setCategoryId] = useState<number>(expenseCategories[0]?.id ?? 0);
  const [amountStr, setAmountStr] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [memo, setMemo] = useState("");
  const [date] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [state, formAction, isPending] = useActionState(createExpenseAction, initialState);

  // レシート読取（#521）: 解析結果はプリフィルのみ。登録は必ずユーザーが確認する
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, startScanTransition] = useTransition();

  const handleReceiptFile = (file: File) => {
    startScanTransition(async () => {
      const formData = new FormData();
      formData.append("receipt", file);
      const result = await scanReceiptAction(formData);

      if (result.status === "error") {
        // 失敗しても手入力はそのまま継続できる
        toast.error("レシートを解析できませんでした", { description: result.message });
        return;
      }

      // API 側で整数・正数に正規化済みだが、キーパッドが整数前提のため防衛的に検証する
      if (result.amount != null && Number.isInteger(result.amount) && result.amount > 0) {
        setAmountStr(String(Math.min(result.amount, MAX_AMOUNT)));
      }
      if (result.content != null) {
        setMemo(result.content);
      }
      const dateNote =
        result.date != null && result.date !== date ? `（日付 ${result.date} は本日扱いになります）` : "";
      const summary = [
        result.amount != null ? `金額: ¥${result.amount.toLocaleString()}` : "金額: 読み取れず",
        result.content != null ? `店名: ${result.content}` : "店名: 読み取れず",
      ].join(" / ");
      toast.success("レシートを読み取りました", {
        description: `${summary}${dateNote} — 内容を確認して登録してください`,
      });
    });
  };

  // 登録成功後の一時的な成功フィードバック（✓ 記録しました！）表示中フラグ
  const [justSubmitted, setJustSubmitted] = useState(false);
  // 画面に表示するフィードバック（エラー / 成功）。ドロワーを閉じたらクリアする
  const [feedback, setFeedback] = useState<ExpenseActionState>(initialState);

  // 登録成功のたびに入力をリセットし、ドロワーは開いたまま連続記録できるようにする（#461）。
  // state は action 実行ごとに新しいオブジェクトが返るため、成功1回につき1回だけ調整する
  //（レンダー中の状態調整パターン。effect 内の同期 setState を避ける）。
  const [handledState, setHandledState] = useState<ExpenseActionState>(initialState);
  if (state !== handledState) {
    setHandledState(state);
    setFeedback(state);
    if (state.success) {
      setAmountStr("");
      setMemo("");
      setJustSubmitted(true);
    }
  }

  // ドロワーを閉じたら前回のフィードバックをクリアする（再オープン時に残さない）
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setFeedback(initialState);
      setJustSubmitted(false);
    }
  }

  // 成功フィードバックを一定時間で通常の記録ボタンへ戻す
  useEffect(() => {
    if (!justSubmitted) return;
    const timer = setTimeout(() => setJustSubmitted(false), SUCCESS_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [justSubmitted]);

  // 登録成功後にホームの数値（サーバーコンポーネント由来）を更新する。
  // action 内の revalidatePath は isPending ハングの原因になるため（#437）、
  // 成功フィードバック表示とは独立にここで refresh する
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  const categories = balanceType === 0 ? expenseCategories : incomeCategories;
  const visible = showAll ? categories : categories.slice(0, VISIBLE_COUNT);
  const rest = categories.slice(VISIBLE_COUNT);
  const brandColor = balanceType === 0 ? "#e07236" : "#27a08f";

  // 「記録後の残り」プレビュー（支出のみ・金額入力中のみ）。サンドボックス AmountPanel 準拠（#461）
  const previewRemaining =
    balanceType === 0 && dailyBudget !== null && amountStr !== "" && Number(amountStr) > 0
      ? Math.max(0, dailyBudget.remaining - Number(amountStr))
      : null;
  const previewWarn =
    previewRemaining !== null &&
    dailyBudget !== null &&
    previewRemaining < dailyBudget.amount * REMAINING_WARN_RATIO;

  function handleTypeChange(type: 0 | 1) {
    setBalanceType(type);
    const cats = type === 0 ? expenseCategories : incomeCategories;
    setCategoryId(cats[0]?.id ?? 0);
    setShowAll(false);
  }

  const handleNumKey = useCallback((k: string) => {
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
  }, []);

  // キーボードで数字入力・削除を可能にする
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      // テキスト入力中（メモ欄など）はスキップ
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumKey(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleNumKey("⌫");
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleNumKey]);

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

        <form action={formAction} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-2 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]"
        >
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="balanceType" value={balanceType} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="amount" value={amountStr || "0"} />
          {memo && <input type="hidden" name="content" value={memo} />}

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

          {/* レシート読取（#521） */}
          <button
            type="button"
            onClick={() => receiptInputRef.current?.click()}
            disabled={isScanning || isPending}
            className="flex shrink-0 items-center justify-center gap-2 py-2.5 text-[13px] font-bold"
            style={{
              borderRadius: "12px",
              border: "1px solid var(--color-brand-primary)",
              background: "var(--color-brand-light)",
              color: "var(--color-brand-primary)",
              opacity: isScanning ? 0.7 : 1,
            }}
          >
            {isScanning ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                レシートを解析中…（最大2分ほどかかります）
              </>
            ) : (
              <>
                <Camera size={15} />
                レシートを読み取って自動入力
              </>
            )}
          </button>
          <input
            ref={receiptInputRef}
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // 同じファイルを再選択できるよう毎回リセットする
              e.target.value = "";
              if (file) handleReceiptFile(file);
            }}
          />

          {/* 金額表示パネル */}
          <div
            className="relative shrink-0 rounded-xl px-4 py-2"
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

            {/* 記録後の残り — 常時レンダリングし opacity 制御で高さを固定（レイアウトシフト防止） */}
            {dailyBudget !== null && balanceType === 0 && (
              <div
                className="mt-1 text-[11px] transition-opacity duration-150"
                style={{
                  color: "rgba(28,20,16,0.45)",
                  opacity: previewRemaining !== null ? 1 : 0,
                }}
                aria-hidden={previewRemaining === null}
              >
                記録後の残り：
                <span
                  className="ml-0.5 font-bold tabular-nums"
                  style={{ color: previewWarn ? "#f43f5e" : "#1c1410" }}
                >
                  {previewRemaining !== null
                    ? `¥${previewRemaining.toLocaleString("ja-JP")}`
                    : ""}
                </span>
              </div>
            )}
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
                className="flex h-10 items-center justify-center select-none text-base font-semibold"
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
          {feedback.error && (
            <p className="rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#1c1410]">
              {feedback.error}
            </p>
          )}
          {feedback.success && (
            <p className="rounded-xl border border-[#4caf82]/40 bg-[#f0fdf6] px-3 py-2 text-sm font-bold text-[#4caf82]">
              登録しました
              {/* 生活余力の即時フィードバック（#418）: 支出登録時のみ・事実の数字だけを示す */}
              {feedback.registeredBalanceType === 0 &&
                effectiveDailyExpense !== null &&
                feedback.registeredAmount !== undefined && (
                  (() => {
                    const impact = formatLivingMarginImpact(feedback.registeredAmount, effectiveDailyExpense);
                    return impact ? (
                      <span className="mt-0.5 block text-xs font-semibold" style={{ color: "rgba(28,20,16,0.55)" }}>
                        {impact}
                      </span>
                    ) : null;
                  })()
                )}
            </p>
          )}

          {/* 記録する（成功直後は一時的に ✓ 記録しました！ へ変化。サンドボックス SubmitButton 準拠） */}
          <AnimatePresence mode="wait" initial={false}>
            {justSubmitted ? (
              <motion.div
                key="submitted"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={SPRING.quick}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-base font-extrabold text-white"
                style={{ background: "linear-gradient(135deg, #35b5a2, #27a08f)" }}
                role="status"
              >
                <Check size={18} strokeWidth={2.5} />
                記録しました！
              </motion.div>
            ) : (
              <motion.button
                key="submit"
                type="submit"
                disabled={isPending || !amountStr}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={SPRING.quick}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-base font-extrabold text-white transition-all active:scale-95 disabled:opacity-40"
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
              </motion.button>
            )}
          </AnimatePresence>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
