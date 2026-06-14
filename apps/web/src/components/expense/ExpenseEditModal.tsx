"use client";

import { useActionState, useEffect, useState } from "react";
import { updateExpenseAction } from "@/lib/actions/expense";
import type { UpdateExpenseActionState } from "@/lib/actions/expense";
import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  expense: ExpenseResponse;
  onClose: () => void;
  expenseCategories: CategoryItem[];
  incomeCategories: CategoryItem[];
};

const initialState: UpdateExpenseActionState = { error: null, success: false };

export function ExpenseEditModal({ expense, onClose, expenseCategories, incomeCategories }: Props) {
  const boundAction = updateExpenseAction.bind(null, expense.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const [balanceType, setBalanceType] = useState<0 | 1>(expense.balanceType);
  const [categoryId, setCategoryId] = useState<number>(expense.categoryId);
  const categories = balanceType === 0 ? expenseCategories : incomeCategories;

  // 更新成功時にモーダルを閉じる
  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>支出を編集</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Radix Select は FormData に含まれないため hidden input で送信 */}
          <input type="hidden" name="balanceType" value={balanceType} />
          <input type="hidden" name="categoryId" value={categoryId} />

          {/* 種別 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1c1410]/60">種別</label>
            <Select
              value={String(balanceType)}
              onValueChange={(v) => {
                const next = Number(v) as 0 | 1;
                setBalanceType(next);
                const cats = next === 0 ? expenseCategories : incomeCategories;
                setCategoryId(cats[0]?.id ?? 0);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">支出</SelectItem>
                <SelectItem value="1">収入</SelectItem>
              </SelectContent>
            </Select>
            {state.fieldErrors?.balanceType && (
              <p className="text-xs text-red-500">{state.fieldErrors.balanceType[0]}</p>
            )}
          </div>

          {/* カテゴリ */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1c1410]/60">カテゴリ</label>
            <Select
              value={String(categoryId)}
              onValueChange={(v) => setCategoryId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 金額 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1c1410]/60">金額（円）</label>
            <input
              type="text"
              inputMode="numeric"
              name="amount"
              defaultValue={expense.amount}
              min={1}
              className="rounded-xl border border-[#e8c8b0] bg-[#fdf8f5] px-3 py-2 text-sm text-[#1c1410] focus:outline-none focus:ring-2 focus:ring-[#f18840]/30"
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
              className="rounded-xl border border-[#e8c8b0] bg-[#fdf8f5] px-3 py-2 text-sm text-[#1c1410] focus:outline-none focus:ring-2 focus:ring-[#f18840]/30"
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
              className="rounded-xl border border-[#e8c8b0] bg-[#fdf8f5] px-3 py-2 text-sm text-[#1c1410] focus:outline-none focus:ring-2 focus:ring-[#f18840]/30"
            />
          </div>

          {state.error && (
            <p className="text-xs text-red-500">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 w-full rounded-xl bg-[#f18840] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isPending ? "更新中..." : "更新する"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
