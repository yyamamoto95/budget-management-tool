"use client";

import { useActionState, useEffect } from "react";
import { X } from "lucide-react";
import { updateExpenseAction } from "@/lib/actions/expense";
import type { UpdateExpenseActionState } from "@/lib/actions/expense";
import type { ExpenseResponse } from "@/lib/api/types";

type Props = {
  expense: ExpenseResponse;
  onClose: () => void;
};

const initialState: UpdateExpenseActionState = { error: null, success: false };

export function ExpenseEditModal({ expense, onClose }: Props) {
  const boundAction = updateExpenseAction.bind(null, expense.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // 更新成功時にモーダルを閉じる
  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[#1c1410]/40 hover:bg-[#f5ebe0] hover:text-[#1c1410]"
        >
          <X size={16} />
        </button>

        <h2 className="mb-5 text-base font-bold text-[#1c1410]">支出を編集</h2>

        <form action={formAction} className="flex flex-col gap-4">
          {/* 種別 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1c1410]/60">種別</label>
            <select
              name="balanceType"
              defaultValue={String(expense.balanceType)}
              className="rounded-xl border border-[#e8c8b0] bg-[#fdf8f5] px-3 py-2 text-sm text-[#1c1410] focus:outline-none focus:ring-2 focus:ring-[#c8956c]"
            >
              <option value="0">支出</option>
              <option value="1">収入</option>
            </select>
            {state.fieldErrors?.balanceType && (
              <p className="text-xs text-red-500">{state.fieldErrors.balanceType[0]}</p>
            )}
          </div>

          {/* 金額 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1c1410]/60">金額（円）</label>
            <input
              type="number"
              name="amount"
              defaultValue={expense.amount}
              min={1}
              className="rounded-xl border border-[#e8c8b0] bg-[#fdf8f5] px-3 py-2 text-sm text-[#1c1410] focus:outline-none focus:ring-2 focus:ring-[#c8956c]"
            />
            {state.fieldErrors?.amount && (
              <p className="text-xs text-red-500">{state.fieldErrors.amount[0]}</p>
            )}
          </div>

          {/* 日付 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1c1410]/60">日付</label>
            <input
              type="date"
              name="date"
              defaultValue={expense.date}
              className="rounded-xl border border-[#e8c8b0] bg-[#fdf8f5] px-3 py-2 text-sm text-[#1c1410] focus:outline-none focus:ring-2 focus:ring-[#c8956c]"
            />
            {state.fieldErrors?.date && (
              <p className="text-xs text-red-500">{state.fieldErrors.date[0]}</p>
            )}
          </div>

          {/* 備考 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1c1410]/60">備考（任意）</label>
            <input
              type="text"
              name="content"
              defaultValue={expense.content ?? ""}
              className="rounded-xl border border-[#e8c8b0] bg-[#fdf8f5] px-3 py-2 text-sm text-[#1c1410] focus:outline-none focus:ring-2 focus:ring-[#c8956c]"
            />
          </div>

          {state.error && (
            <p className="text-xs text-red-500">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 w-full rounded-xl bg-[#c8956c] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isPending ? "更新中..." : "更新する"}
          </button>
        </form>
      </div>
    </div>
  );
}
