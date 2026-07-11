"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, ChevronDown, CircleAlert, CircleCheck, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PAGE_VARIANTS, PAGE_ITEM_VARIANTS, SPRING } from "@/lib/motion";
import type { CategoryItem } from "@/lib/api/types";
import {
  analyzeImportAction,
  commitImportAction,
  type ImportCandidateRow,
} from "@/lib/actions/imports";
import { AmountField } from "@/components/common/AmountField";

type Props = {
  expenseCategories: CategoryItem[];
  incomeCategories: CategoryItem[];
};

type Phase = "idle" | "analyzing" | "review" | "done";

/** 解析中に段階的に切り替える進捗文言（API に進捗率はないため時間ベース） */
const ANALYZING_PHASES = [
  "画像を読み取っています…",
  "明細行を抽出しています…",
  "カテゴリを推定しています…",
  "もう少しで完了します…",
] as const;

/** 一覧行の状態 = 解析候補 + 編集差分 + 選択 */
type RowState = ImportCandidateRow & { id: number; selected: boolean };

function yen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

/**
 * スクショ一括取り込み（#566 / #559。sandbox #565 承認済みデザインの本実装）
 * 画像選択 → 解析 → 候補の確認・編集 → 一括登録。
 * 内容は推定のため、断定しないトーン（候補・要確認）で表示する。
 */
export function ImportClient({ expenseCategories, incomeCategories }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rows, setRows] = useState<RowState[]>([]);
  const [skippedRows, setSkippedRows] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [registered, setRegistered] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // アンマウント時に進捗タイマーを確実に破棄する（レビュー指摘対応）
  useEffect(() => {
    return () => {
      if (phaseTimer.current) clearInterval(phaseTimer.current);
    };
  }, []);

  const categoryOf = (row: RowState): CategoryItem | undefined =>
    (row.balanceType === 0 ? expenseCategories : incomeCategories).find(
      (c) => c.id === row.categoryId,
    );

  const selectedRows = rows.filter((r) => r.selected);
  const totalOut = selectedRows
    .filter((r) => r.balanceType === 0)
    .reduce((sum, r) => sum + r.amount, 0);
  const totalIn = selectedRows
    .filter((r) => r.balanceType === 1)
    .reduce((sum, r) => sum + r.amount, 0);
  const editing = useMemo(
    () => (editingId !== null ? (rows.find((r) => r.id === editingId) ?? null) : null),
    [rows, editingId],
  );

  const handleFile = async (file: File) => {
    setPhase("analyzing");
    setPhaseIndex(0);
    phaseTimer.current = setInterval(() => {
      setPhaseIndex((i) => Math.min(i + 1, ANALYZING_PHASES.length - 1));
    }, 8000);

    const formData = new FormData();
    formData.append("statement", file);
    const result = await analyzeImportAction(formData);

    if (phaseTimer.current) clearInterval(phaseTimer.current);
    if (result.status === "error") {
      toast.error("スクショを解析できませんでした", { description: result.message });
      setPhase("idle");
      return;
    }
    if (result.candidates.length === 0) {
      toast.error("明細を読み取れませんでした", {
        description: "明細一覧が写ったスクリーンショットを選び直してください",
      });
      setPhase("idle");
      return;
    }
    // API 側で検証済みだが、金額が正の整数であることを state 反映前にも防衛的に確認する
    const validCandidates = result.candidates.filter(
      (candidate) => Number.isInteger(candidate.amount) && candidate.amount > 0,
    );
    setRows(
      validCandidates.map((candidate, index) => ({
        ...candidate,
        id: index,
        // 登録済みの可能性がある行は初期選択オフ（含め直しはユーザー判断）
        selected: !candidate.duplicateSuspect,
      })),
    );
    setSkippedRows(result.skippedRows);
    setPhase("review");
  };

  const handleCommit = async () => {
    setSubmitting(true);
    const result = await commitImportAction(
      selectedRows.map((r) => ({
        date: r.date,
        amount: r.amount,
        balanceType: r.balanceType,
        categoryId: r.categoryId,
        content: r.content,
      })),
    );
    setSubmitting(false);
    if (result.status === "error") {
      toast.error("登録に失敗しました", { description: result.message });
      return;
    }
    setRegistered(result.registered);
    setPhase("done");
  };

  const updateRow = (id: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 md:px-6 md:py-5">
      <motion.div variants={PAGE_VARIANTS} initial="hidden" animate="visible" className="flex flex-col gap-4">
        <motion.div variants={PAGE_ITEM_VARIANTS}>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--foreground)" }}>
            スクショ一括取り込み
          </h1>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.55 }}>
            銀行やカードの明細一覧のスクリーンショットから記録をまとめて登録できます。
            読み取り内容は推定のため、登録前に確認・修正してください。画像は保存されません。
          </p>
        </motion.div>

        {/* 画像選択 */}
        {phase === "idle" && (
          <motion.div variants={PAGE_ITEM_VARIANTS}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              data-testid="import-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10"
              style={{ borderColor: "var(--border-default)", background: "var(--color-surface-default)" }}
            >
              <Camera size={28} style={{ color: "var(--color-brand-primary)" }} aria-hidden />
              <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                スクリーンショットを選ぶ
              </span>
              <span className="text-[11px]" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                JPEG / PNG・7MB まで・1枚ずつ
              </span>
            </button>
          </motion.div>
        )}

        {/* 解析中 */}
        {phase === "analyzing" && (
          <motion.div
            variants={PAGE_ITEM_VARIANTS}
            className="flex flex-col items-center gap-3 rounded-2xl border px-6 py-10"
            style={{ borderColor: "var(--border-default)", background: "var(--color-surface-default)" }}
          >
            <span
              className="inline-block size-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--color-brand-primary)", borderTopColor: "transparent" }}
              aria-hidden
            />
            <p className="text-sm font-semibold" role="status" style={{ color: "var(--foreground)", opacity: 0.7 }}>
              {ANALYZING_PHASES[phaseIndex]}
            </p>
            <p className="text-[11px]" style={{ color: "var(--foreground)", opacity: 0.45 }}>
              画像の内容によって 30 秒〜1 分ほどかかります
            </p>
          </motion.div>
        )}

        {/* 確認・編集 */}
        {phase === "review" && (
          <motion.div
            variants={PAGE_ITEM_VARIANTS}
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--border-default)", background: "var(--color-surface-default)" }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: "var(--border-default)" }}
            >
              <span className="text-sm font-extrabold" style={{ color: "var(--foreground)" }}>
                読み取り結果 {rows.length} 件
              </span>
              <button
                type="button"
                onClick={() => {
                  setPhase("idle");
                  setRows([]);
                }}
                className="text-[11px] font-bold underline underline-offset-2"
                style={{ color: "var(--foreground)", opacity: 0.5 }}
              >
                画像を選び直す
              </button>
            </div>

            {skippedRows > 0 && (
              <div
                className="flex items-start gap-2 border-b px-4 py-2.5 text-[11px] leading-relaxed"
                style={{
                  borderColor: "var(--border-default)",
                  background: "var(--color-caution-light)",
                  color: "var(--foreground)",
                }}
              >
                <CircleAlert size={13} style={{ color: "var(--color-caution)", flexShrink: 0, marginTop: 1 }} />
                読み取れなかった行が {skippedRows} 行あります。不足分は撮り直すか手入力で追加してください。
              </div>
            )}

            {rows.map((row) => {
              const category = categoryOf(row);
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 border-b px-4 py-3"
                  style={{ borderColor: "var(--border-default)", opacity: row.selected ? 1 : 0.5 }}
                >
                  <button
                    type="button"
                    onClick={() => updateRow(row.id, { selected: !row.selected })}
                    aria-label={`${row.content} を${row.selected ? "除外する" : "含める"}`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border"
                    style={{
                      borderColor: row.selected ? "var(--color-brand-primary)" : "var(--border-default)",
                      background: row.selected ? "var(--color-brand-primary)" : "transparent",
                      color: "#fff",
                    }}
                  >
                    {row.selected && <Check size={14} strokeWidth={3} />}
                  </button>

                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setEditingId(row.id)}
                    aria-label={`${row.content} を編集`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                        {row.content}
                      </span>
                      <Pencil size={11} style={{ color: "var(--foreground)", opacity: 0.4, flexShrink: 0 }} aria-hidden />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span style={{ color: "var(--foreground)", opacity: 0.5 }}>
                        {row.date.replaceAll("-", "/")}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 font-bold"
                        style={{
                          background: category?.bg ?? "var(--color-surface-subtle)",
                          color: category?.color ?? "var(--foreground)",
                        }}
                      >
                        {category?.name ?? "その他"}
                      </span>
                      {row.confidence === "low" && (
                        <span
                          className="rounded-full px-1.5 py-0.5 font-bold"
                          style={{ background: "var(--color-caution-light)", color: "var(--color-caution)" }}
                        >
                          要確認
                        </span>
                      )}
                      {row.duplicateSuspect && (
                        <span
                          className="rounded-full px-1.5 py-0.5 font-bold"
                          style={{ background: "var(--color-surface-subtle)", color: "var(--foreground)" }}
                        >
                          登録済みの可能性
                        </span>
                      )}
                    </div>
                  </button>

                  <span
                    className="shrink-0 text-sm font-extrabold tabular-nums"
                    style={{ color: row.balanceType === 1 ? "var(--color-income)" : "var(--foreground)" }}
                  >
                    {row.balanceType === 1 ? "+" : "−"}
                    {yen(row.amount)}
                  </span>
                </div>
              );
            })}

            <div className="px-4 py-3.5">
              <motion.button
                type="button"
                onClick={() => void handleCommit()}
                disabled={selectedRows.length === 0 || submitting}
                whileTap={{ scale: 0.97 }}
                transition={SPRING.snap}
                className="w-full rounded-xl py-3 text-sm font-extrabold text-white disabled:opacity-40"
                style={{ background: "var(--color-brand-primary)", boxShadow: "0 4px 12px rgba(241,136,64,0.3)" }}
              >
                {submitting
                  ? "登録中..."
                  : `${selectedRows.length} 件を登録する（支出 −${yen(totalOut)}${totalIn > 0 ? ` / 収入 +${yen(totalIn)}` : ""}）`}
              </motion.button>
              <p className="mt-2 text-center text-[10px]" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                登録後は通常の明細として編集・削除できます
              </p>
            </div>
          </motion.div>
        )}

        {/* 完了 */}
        {phase === "done" && (
          <motion.div
            variants={PAGE_ITEM_VARIANTS}
            className="flex flex-col items-center gap-3 rounded-2xl border px-6 py-10"
            style={{ borderColor: "var(--border-default)", background: "var(--color-surface-default)" }}
          >
            <CircleCheck size={32} style={{ color: "var(--color-income)" }} aria-hidden />
            <p className="text-base font-extrabold" style={{ color: "var(--foreground)" }}>
              {registered} 件を登録しました
            </p>
            <div className="mt-1 flex gap-3">
              <Link
                href="/records"
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-white"
                style={{ background: "var(--color-brand-primary)" }}
              >
                明細で確認する
              </Link>
              <button
                type="button"
                onClick={() => {
                  setPhase("idle");
                  setRows([]);
                  setRegistered(0);
                }}
                className="rounded-xl border px-4 py-2.5 text-xs font-bold"
                style={{ borderColor: "var(--border-default)", color: "var(--foreground)" }}
              >
                続けて取り込む
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 編集シート */}
      <AnimatePresence>
        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/30"
            onClick={() => setEditingId(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={SPRING.quick}
              className="w-full rounded-t-3xl border-t p-5 pb-8"
              style={{ background: "var(--color-surface-default)", borderColor: "var(--border-default)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex max-w-2xl flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold" style={{ color: "var(--foreground)" }}>
                    候補を修正
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: "var(--color-surface-subtle)", color: "var(--foreground)" }}
                  >
                    <ChevronDown size={14} aria-hidden /> 閉じる
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                    金額
                  </span>
                  <AmountField
                    value={editing.amount}
                    onChange={(v) => updateRow(editing.id, { amount: v })}
                    step={100}
                    min={1}
                    label="取り込み金額"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[11px] font-semibold"
                    style={{ color: "var(--foreground)", opacity: 0.6 }}
                    htmlFor="import-edit-date"
                  >
                    日付
                  </label>
                  <input
                    id="import-edit-date"
                    type="date"
                    value={editing.date}
                    onChange={(e) => e.target.value && updateRow(editing.id, { date: e.target.value })}
                    className="rounded-md border px-3 py-2 text-sm font-bold"
                    style={{
                      borderColor: "var(--border-default)",
                      background: "var(--color-surface-default)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                    カテゴリ
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(editing.balanceType === 0 ? expenseCategories : incomeCategories).map((category) => {
                      const active = editing.categoryId === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            updateRow(editing.id, { categoryId: category.id, confidence: "high" })
                          }
                          className="rounded-full border px-2.5 py-1.5 text-[11px] font-bold"
                          style={{
                            borderColor: active ? category.color : "var(--border-default)",
                            background: active ? category.bg : "var(--color-surface-default)",
                            color: active ? category.color : "var(--foreground)",
                          }}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[10px]" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                  読み取り原文: {editing.raw || editing.content}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
