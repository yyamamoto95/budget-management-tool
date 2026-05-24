"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, PenLine } from "lucide-react";
import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";
import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";

type Props = {
  expenses: ExpenseResponse[];
  userId: string;
  allCategories: CategoryItem[];
};

export function CalendarView({ expenses, allCategories }: Props) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const selectedExpenses = expenses.filter((e) => e.date === selectedDate);
  const outgo = selectedExpenses
    .filter((e) => e.balanceType === 0)
    .reduce((s, e) => s + e.amount, 0);
  const income = selectedExpenses
    .filter((e) => e.balanceType === 1)
    .reduce((s, e) => s + e.amount, 0);

  const selectedLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString(
    "ja-JP",
    { month: "long", day: "numeric", weekday: "short" },
  );

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-3 py-3 bg-[#fffdf5]">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-sm font-extrabold text-[#1c1410]">カレンダー</h1>
        <Link
          href={`/expenses/new?date=${selectedDate}`}
          className="flex items-center gap-1.5 rounded-full border-2 border-[#1c1410] bg-[#f18840] px-3 py-1.5 text-xs font-bold text-white transition-opacity active:opacity-70"
        >
          <PenLine size={12} />
          詳細記録
        </Link>
      </div>

      {/* カレンダー（コンパクトモード） */}
      <MonthlyCalendar
        expenses={expenses}
        compactMode
        onDaySelect={setSelectedDate}
        selectedDate={selectedDate}
      />

      {/* 選択日の収支サマリー */}
      <div className="mt-3 rounded-2xl border-2 border-[#1c1410] bg-white overflow-hidden" style={{ boxShadow: "var(--shadow-pop-sm)" }}>
        <div className="px-4 py-2.5 border-b border-[#e8c8b0]">
          <p className="text-sm font-extrabold text-[#1c1410]">{selectedLabel}</p>
        </div>
        <div className="flex divide-x divide-[#e8c8b0]">
          <div className="flex-1 px-4 py-3 text-center">
            <p className="text-xs text-[#1c1410]/50 mb-0.5">支出</p>
            <p
              className="text-lg font-extrabold tabular-nums"
              style={{ color: outgo > 0 ? "var(--color-expense)" : "#1c1410" }}
            >
              {outgo > 0 ? `¥${outgo.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="flex-1 px-4 py-3 text-center">
            <p className="text-xs text-[#1c1410]/50 mb-0.5">収入</p>
            <p
              className="text-lg font-extrabold tabular-nums"
              style={{ color: income > 0 ? "var(--color-income)" : "#1c1410" }}
            >
              {income > 0 ? `¥${income.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* 選択日の明細リスト */}
      <div className="mt-3">
        <p className="text-xs font-bold text-[#1c1410]/40 px-1 mb-2">明細</p>
        {selectedExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[#1c1410]/30">
            <FileText size={32} className="mb-2 opacity-40" />
            <p className="text-sm">この日の記録はありません</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
            {selectedExpenses.map((e) => {
              const cat = allCategories.find(
                (c) => c.balanceType === e.balanceType && c.id === e.categoryId,
              );
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl border border-[#e8c8b0] bg-white px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#1c1410]/50">
                      {cat?.name ?? "未分類"}
                    </p>
                    <p className="text-sm font-semibold text-[#1c1410] truncate">
                      {e.content ?? "—"}
                    </p>
                  </div>
                  <p
                    className="text-sm font-extrabold tabular-nums shrink-0"
                    style={{
                      color:
                        e.balanceType === 0
                          ? "var(--color-expense)"
                          : "var(--color-income)",
                    }}
                  >
                    {e.balanceType === 0 ? "-" : "+"}¥
                    {e.amount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
