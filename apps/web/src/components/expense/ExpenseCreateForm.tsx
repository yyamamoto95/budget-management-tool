"use client";

import { useActionState, useState } from "react";
import { ChevronDown } from "lucide-react";
import { createExpenseAction } from "@/lib/actions/expense";
import type { ExpenseActionState } from "@/lib/actions/expense";
import type { CategoryItem } from "@/lib/api/types";

type Props = {
  /** ログイン中のユーザー ID */
  userId: string;
  /** 初期表示する日付（YYYY-MM-DD 形式。省略時は今日） */
  defaultDate?: string;
  /** 初期選択する収支種別（0=支出, 1=収入。省略時は0） */
  defaultBalanceType?: 0 | 1;
  /** 支出カテゴリ一覧 */
  expenseCategories: CategoryItem[];
  /** 収入カテゴリ一覧 */
  incomeCategories: CategoryItem[];
};

const initialState: ExpenseActionState = { error: null, success: false };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="mt-1 text-xs font-medium text-[#f87171]">{messages[0]}</p>
  );
}

export function ExpenseCreateForm({ userId, defaultDate, defaultBalanceType = 0, expenseCategories, incomeCategories }: Props) {
  const [balanceType, setBalanceType] = useState<0 | 1>(defaultBalanceType);
  const [categoryId, setCategoryId] = useState<number>(expenseCategories[0]?.id ?? 0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createExpenseAction,
    initialState,
  );
  const categories = balanceType === 0 ? expenseCategories : incomeCategories;

  // 種別に応じたアクセントカラー
  const isExpense = balanceType === 0;
  const accentColor = isExpense ? "var(--color-expense, #e05c5c)" : "var(--color-income, #4caf82)";
  const accentBg = isExpense ? "var(--color-expense-light, #fdf0f0)" : "var(--color-income-light, #f0fdf6)";

  return (
    <section
      id="form"
      className="rounded-2xl border border-[#1c1410]/12 bg-white overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* 種別タブ */}
      <div className="flex">
        <button
          type="button"
          onClick={() => { setBalanceType(0); setCategoryId(expenseCategories[0]?.id ?? 0); }}
          className="flex-1 py-3 text-sm font-bold transition-colors"
          style={
            balanceType === 0
              ? { background: "var(--color-expense, #e05c5c)", color: "#fff" }
              : { color: "rgba(28,20,16,0.4)" }
          }
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => { setBalanceType(1); setCategoryId(incomeCategories[0]?.id ?? 0); }}
          className="flex-1 py-3 text-sm font-bold transition-colors"
          style={
            balanceType === 1
              ? { background: "var(--color-income, #4caf82)", color: "#fff" }
              : { color: "rgba(28,20,16,0.4)" }
          }
        >
          収入
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-0 px-4 pb-4 pt-3">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="balanceType" value={balanceType} />

        {/* 金額（大型表示） */}
        <div
          className="mb-3 rounded-xl px-3 py-2"
          style={{ background: accentBg, borderBottom: `3px solid ${accentColor}` }}
        >
          <label htmlFor="amount" className="block text-xs font-bold" style={{ color: accentColor }}>
            金額（円）
          </label>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold" style={{ color: accentColor }}>¥</span>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="numeric"
              required
              placeholder="0"
              className="flex-1 bg-transparent text-4xl font-extrabold tabular-nums outline-none placeholder:text-[#1c1410]/20"
              style={{ color: accentColor }}
            />
          </div>
          <FieldError messages={state.fieldErrors?.amount} />
        </div>

        {/* カテゴリ */}
        <div className="mb-3">
          <label htmlFor="categoryId" className="block text-xs font-bold text-[#1c1410]/50 mb-1.5">
            カテゴリ
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full rounded-xl border border-[#1c1410]/12 bg-[#fdf8f5] px-3 py-2 text-sm font-semibold text-[#1c1410] outline-none focus:ring-2"
            style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* 日付 */}
        <div className="mb-3">
          <label htmlFor="date" className="block text-xs font-bold text-[#1c1410]/50 mb-1.5">
            日付
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate ?? new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl border border-[#1c1410]/12 bg-[#fdf8f5] px-3 py-2 text-sm font-semibold text-[#1c1410] outline-none"
          />
          <FieldError messages={state.fieldErrors?.date} />
        </div>

        {/* 備考（アコーディオン） */}
        <div className="mb-3 rounded-xl border border-[#1c1410]/12 overflow-hidden">
          <button
            type="button"
            onClick={() => setNoteOpen(!noteOpen)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-bold text-[#1c1410]/50 hover:bg-[#fdf8f5] transition-colors"
          >
            備考（任意）
            <ChevronDown
              size={14}
              className="transition-transform"
              style={{ transform: noteOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
          {noteOpen && (
            <div className="border-t border-[#1c1410]/10 px-3 pb-2.5 pt-2">
              <input
                name="content"
                type="text"
                placeholder="例: スーパーで食材"
                className="w-full bg-transparent text-sm text-[#1c1410] outline-none placeholder:text-[#1c1410]/30"
              />
            </div>
          )}
        </div>

        {state.error && (
          <p className="mb-2 rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#1c1410]">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="mb-2 rounded-xl border border-[#4caf82]/40 bg-[#f0fdf6] px-3 py-2 text-sm font-bold text-[#4caf82]">
            登録しました
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl py-3 text-sm font-extrabold text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: accentColor }}
        >
          {isPending ? "登録中..." : "追加する"}
        </button>
      </form>
    </section>
  );
}
