"use client";

import { useState } from "react";
import { X, Pencil } from "lucide-react";
import { deleteBudgetAction } from "@/lib/actions/budget";
import { ExpenseEditModal } from "@/components/expense/ExpenseEditModal";
import type { BudgetResponse } from "@budget/api-client";
import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";

type Props = {
  item: BudgetResponse;
  expenseCategories: CategoryItem[];
  incomeCategories: CategoryItem[];
};

function toExpenseResponse(item: BudgetResponse): ExpenseResponse {
  return {
    id: item.id,
    userId: "",
    balanceType: item.balanceType,
    categoryId: item.categoryId,
    amount: item.amount,
    date: item.date,
    content: item.content ?? null,
    createdDate: "",
    updatedDate: "",
    deletedDate: null,
  };
}

export function ReportDetailItem({ item, expenseCategories, incomeCategories }: Props) {
  const [editing, setEditing] = useState(false);
  const allCategories = [...expenseCategories, ...incomeCategories];
  const category = allCategories.find(
    (c) => c.balanceType === item.balanceType && c.id === item.categoryId,
  );
  const isIncome = item.balanceType === 1;
  const deleteAction = deleteBudgetAction.bind(null, item.id);

  return (
    <>
      <li className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          {category && (
            <span
              className="h-3 w-3 flex-shrink-0 rounded-full border border-[#1c1410]/10"
              style={{ backgroundColor: category.color }}
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1c1410]">
              {category?.name ?? "未分類"}
            </span>
            {item.content && (
              <span className="text-xs font-medium text-[#1c1410]/40">
                {item.content}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-extrabold tabular-nums"
            style={{
              color: isIncome ? "var(--color-income)" : "var(--color-expense)",
            }}
          >
            {isIncome ? "+" : "-"}¥{item.amount.toLocaleString()}
          </span>
          <button
            type="button"
            aria-label="編集"
            onClick={() => setEditing(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e8c8b0] bg-white text-[#1c1410]/40 transition-colors hover:border-[#f18840] hover:bg-[#fff6ee] hover:text-[#f18840]"
          >
            <Pencil size={12} />
          </button>
          <form action={deleteAction}>
            <button
              type="submit"
              aria-label="削除"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e8c8b0] bg-white text-[#1c1410]/40 transition-colors hover:border-[#f87171] hover:bg-[#fee2e2] hover:text-[#f87171]"
            >
              <X size={12} />
            </button>
          </form>
        </div>
      </li>
      {editing && (
        <ExpenseEditModal
          expense={toExpenseResponse(item)}
          onClose={() => setEditing(false)}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
        />
      )}
    </>
  );
}
