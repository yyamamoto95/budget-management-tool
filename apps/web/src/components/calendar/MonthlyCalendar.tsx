"use client";

import { useState } from "react";
import type { ExpenseResponse } from "@/lib/api/types";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  expenses: ExpenseResponse[];
  /** trueのとき金額数値を非表示にしてドットのみ表示する（モバイル向け） */
  compactMode?: boolean;
  /** 指定するとページ遷移の代わりにコールバックが呼ばれる */
  onDaySelect?: (dateStr: string) => void;
  /** 選択中の日付（onDaySelect と組み合わせて使う） */
  selectedDate?: string | null;
};

type DayData = {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  outgo: number;
  income: number;
};

const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function buildCalendarDays(year: number, month: number, expenses: ExpenseResponse[]): DayData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startPad = firstDay.getDay();
  const days: DayData[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      date: d,
      dateStr: d.toISOString().split("T")[0],
      isCurrentMonth: false,
      isToday: false,
      outgo: 0,
      income: 0,
    });
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().split("T")[0];
    const dayExpenses = expenses.filter((e) => e.date === dateStr);
    const outgo = dayExpenses
      .filter((e) => e.balanceType === 0)
      .reduce((s, e) => s + e.amount, 0);
    const income = dayExpenses
      .filter((e) => e.balanceType === 1)
      .reduce((s, e) => s + e.amount, 0);

    days.push({
      date: d,
      dateStr,
      isCurrentMonth: true,
      isToday: d.getTime() === today.getTime(),
      outgo,
      income,
    });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      dateStr: d.toISOString().split("T")[0],
      isCurrentMonth: false,
      isToday: false,
      outgo: 0,
      income: 0,
    });
  }

  return days;
}

export function MonthlyCalendar({ expenses, compactMode = false, onDaySelect, selectedDate }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const router = useRouter();

  const days = buildCalendarDays(year, month, expenses);

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleDayClick = (day: DayData) => {
    if (!day.isCurrentMonth) return;
    if (onDaySelect) {
      onDaySelect(day.dateStr);
    } else {
      router.push(`/expenses/new?date=${day.dateStr}`);
    }
  };

  return (
    <section
      className="flex h-full flex-col rounded-2xl border-2 border-[#1c1410] bg-white overflow-hidden"
      style={{ boxShadow: "var(--shadow-pop)" }}
    >
      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between border-b-2 border-[#1c1410] bg-[#f18840] px-4 py-3 text-white">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="前月"
        >
          <ChevronLeft size={14} />
        </button>
        <h2 className="text-sm font-extrabold">
          {year}年{month + 1}月
        </h2>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="翌月"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-[#e8c8b0] bg-[#fffdf5]">
        {WEEK_DAYS.map((day, i) => {
          // 曜日の文字色: 日曜=赤、土曜=緑、平日=薄黒
          let dayColor: string;
          if (i === 0) dayColor = "text-[#f87171]";
          else if (i === 6) dayColor = "text-[#35b5a2]";
          else dayColor = "text-[#1c1410]/50";
          return (
            <div
              key={day}
              className={["py-2 text-center text-xs font-extrabold", dayColor].join(" ")}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 日付グリッド */}
      <div className={["grid flex-1 grid-cols-7", compactMode ? "grid-rows-6" : "grid-rows-6"].join(" ")}>
        {days.map((day, idx) => {
          const isSelected = selectedDate != null && day.dateStr === selectedDate;
          // コンパクトモードの日付数字スタイル
          let compactDayClass: string;
          if (!day.isCurrentMonth) compactDayClass = "text-[#1c1410]/20";
          else if (isSelected) compactDayClass = "bg-[#f18840] text-white";
          else if (day.isToday) compactDayClass = "border-2 border-[#f18840] text-[#f18840]";
          else compactDayClass = "text-[#1c1410]";
          // 通常モードの日付数字スタイル
          let normalDayClass: string;
          if (!day.isCurrentMonth) normalDayClass = "text-[#1c1410]/20";
          else if (day.isToday) normalDayClass = "rounded-full bg-[#f18840] px-1 text-white";
          else normalDayClass = "text-[#1c1410]";
          return (
            <button
              key={day.dateStr + (day.isCurrentMonth ? "" : `-pad${idx}`)}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={!day.isCurrentMonth}
              className={[
                "relative flex flex-col items-center justify-center border-b border-r border-[#e8c8b0] transition-colors",
                compactMode ? "py-1" : "items-start p-1 text-left",
                day.isCurrentMonth
                  ? "hover:bg-[#fff6ee] cursor-pointer"
                  : "cursor-default",
                isSelected ? "bg-[#fff1e5]" : "",
              ].join(" ")}
              style={compactMode ? { height: 44 } : {}}
            >
              {compactMode ? (
                <>
                  {/* コンパクト: 日付数字を丸で強調 */}
                  <span
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold leading-none transition-colors",
                      compactDayClass,
                    ].join(" ")}
                  >
                    {day.date.getDate()}
                  </span>
                  {/* ドットのみ */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {day.outgo > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#f18840]" />
                    )}
                    {day.income > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#35b5a2]" />
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* 通常: 日付数字 + 金額表示 */}
                  <span
                    className={["mb-0.5 text-xs font-bold", normalDayClass].join(" ")}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.outgo > 0 && (
                    <div className="flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#f18840]" />
                      <span className="text-[9px] font-bold text-[#1c1410]/60">
                        {day.outgo >= 1000
                          ? `${Math.floor(day.outgo / 1000)}k`
                          : day.outgo}
                      </span>
                    </div>
                  )}
                  {day.income > 0 && (
                    <div className="flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#35b5a2]" />
                      <span className="text-[9px] font-bold text-[#1c1410]/60">
                        {day.income >= 1000
                          ? `${Math.floor(day.income / 1000)}k`
                          : day.income}
                      </span>
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
