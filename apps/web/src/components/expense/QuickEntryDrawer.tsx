"use client";

import { useActionState, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { createExpenseAction } from "@/lib/actions/expense";
import type { ExpenseActionState } from "@/lib/actions/expense";
import type { CategoryItem } from "@/lib/api/types";

type Props = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseCategories: CategoryItem[];
  incomeCategories: CategoryItem[];
};

const initialState: ExpenseActionState = { error: null, success: false };

export function QuickEntryDrawer({ userId, open, onOpenChange, expenseCategories, incomeCategories }: Props) {
  const [balanceType, setBalanceType] = useState<0 | 1>(0);
  const [categoryId, setCategoryId] = useState<number>(expenseCategories[0]?.id ?? 0);
  const [state, formAction, isPending] = useActionState(
    createExpenseAction,
    initialState,
  );

  const categories = balanceType === 0 ? expenseCategories : incomeCategories;
  const accentColor =
    balanceType === 0 ? "var(--color-expense)" : "var(--color-income)";
  const today = new Date().toISOString().split("T")[0];

  function handleTypeChange(type: 0 | 1) {
    setBalanceType(type);
    const cats = type === 0 ? expenseCategories : incomeCategories;
    setCategoryId(cats[0]?.id ?? 0);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="rounded-t-3xl bg-white outline-none border-0"
        style={{ boxShadow: "0 -4px 32px rgba(28,20,16,0.16)" }}
        aria-describedby={undefined}
      >
        {/* DrawerContent がドラッグハンドルを内包しているため省略 */}

        <DrawerTitle className="px-5 pt-2 pb-1 text-sm font-extrabold text-[#1c1410]">
          クイック記録
        </DrawerTitle>

        <form action={formAction} className="px-5 pb-8 pt-2 flex flex-col gap-4">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="balanceType" value={balanceType} />
          <input type="hidden" name="date" value={today} />
          <input type="hidden" name="categoryId" value={categoryId} />

          {/* 種別タブ */}
          <div className="flex rounded-xl border border-[#1c1410]/12 bg-[#f5f0eb] p-1">
            {([0, 1] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className="flex-1 rounded-lg py-2 text-sm font-bold transition-all"
                style={
                  balanceType === t
                    ? {
                        background:
                          t === 0
                            ? "var(--color-expense)"
                            : "var(--color-income)",
                        color: "#fff",
                      }
                    : { color: "rgba(28,20,16,0.4)" }
                }
              >
                {t === 0 ? "支出" : "収入"}
              </button>
            ))}
          </div>

          {/* 金額 */}
          <div className="rounded-xl border border-[#1c1410]/12 bg-[#fafaf8] px-4 py-3">
            <div className="flex items-baseline gap-1">
              <span
                className="text-xl font-extrabold"
                style={{ color: accentColor }}
              >
                ¥
              </span>
              <input
                name="amount"
                type="number"
                inputMode="numeric"
                placeholder="0"
                min={1}
                required
                className="flex-1 bg-transparent text-3xl font-extrabold tabular-nums outline-none placeholder:text-[#1c1410]/20"
                style={{ color: accentColor }}
                autoFocus
              />
            </div>
            {state.fieldErrors?.amount && (
              <p className="mt-1 text-xs font-medium text-[#f87171]">
                {state.fieldErrors.amount[0]}
              </p>
            )}
          </div>

          {/* カテゴリ（横スクロール） */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-all"
                style={
                  categoryId === c.id
                    ? {
                        background: accentColor,
                        borderColor: accentColor,
                        color: "#fff",
                      }
                    : {
                        background: "#fff",
                        borderColor: "rgba(28,20,16,0.12)",
                        color: "rgba(28,20,16,0.6)",
                      }
                }
              >
                {c.name}
              </button>
            ))}
          </div>

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

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-2xl py-4 text-base font-extrabold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "var(--color-brand-primary)" }}
          >
            {isPending ? "登録中..." : "記録する"}
          </button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
