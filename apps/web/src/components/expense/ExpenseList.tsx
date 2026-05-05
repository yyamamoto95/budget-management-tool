"use client";

import { useState } from "react";
import { deleteExpenseAction } from "@/lib/actions/expense";
import type { ExpenseResponse } from "@/lib/api/types";
import { Pencil, X } from "lucide-react";
import { ExpenseEditModal } from "./ExpenseEditModal";

type Props = {
  expenses: ExpenseResponse[];
};

export function ExpenseList({ expenses }: Props) {
  const [editTarget, setEditTarget] = useState<ExpenseResponse | null>(null);

  if (expenses.length === 0) {
    return (
      <p className="py-12 text-center text-sm font-medium text-[#1c1410]/40">
        まだ支出が登録されていません
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-[#e8c8b0]">
        {expenses.map((expense) => {
          const isOutgo = expense.balanceType === 0;
          const deleteAction = deleteExpenseAction.bind(null, expense.id);
          return (
            <li key={expense.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#1c1410]/40">
                  {expense.date}
                </span>
                {expense.content && (
                  <span className="text-sm font-medium text-[#1c1410]">
                    {expense.content}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className="text-xs font-bold"
                    style={{ color: isOutgo ? "var(--color-expense)" : "var(--color-income)" }}
                  >
                    {isOutgo ? "支出" : "収入"}
                  </span>
                  <span
                    className="text-base font-extrabold tabular-nums"
                    style={{ color: isOutgo ? "var(--color-expense)" : "var(--color-income)" }}
                  >
                    {isOutgo ? "-" : "+"}¥{expense.amount.toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="編集"
                  onClick={() => setEditTarget(expense)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#e8c8b0] bg-white text-[#1c1410]/40 transition-colors hover:border-[#c8956c] hover:bg-[#fdf8f5] hover:text-[#c8956c]"
                >
                  <Pencil size={12} />
                </button>
                <form action={deleteAction}>
                  <button
                    type="submit"
                    aria-label="削除"
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#e8c8b0] bg-white text-[#1c1410]/40 transition-colors hover:border-[#f87171] hover:bg-[#fee2e2] hover:text-[#f87171]"
                  >
                    <X size={12} />
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      {editTarget && (
        <ExpenseEditModal
          expense={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
