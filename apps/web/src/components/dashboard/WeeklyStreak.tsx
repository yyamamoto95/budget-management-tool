"use client";

import { useState, type ReactNode } from "react";
import { formatYen, weeklyStreakStateOf, countWeeklyAchievement, type WeeklyStreakState } from "@budget/common";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, HelpCircle, MinusCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { SPRING } from "@/lib/motion";

type WeeklyRecord = {
  date: string;
  dow: string;
  expense: number;
  recorded: boolean;
};

type Props = {
  weeklyRecord: WeeklyRecord[];
  dailyBudget: number | null;
};

// 状態判定・金額表示は @budget/common に共通化（モバイル WeeklyStreak と単一実装 #539）
type StreakState = WeeklyStreakState;

function StreakTooltipContent({
  dow, date, state, expense, dailyBudget,
}: {
  dow: string; date: string; state: StreakState; expense: number; dailyBudget: number;
}) {
  const [, m, d] = date.split("-");
  const dateLabel = `${parseInt(m)}/${parseInt(d)} (${dow})`;
  const saving = dailyBudget - expense;
  const over = expense - dailyBudget;

  if (state === "future") return null;

  return (
    <div className="flex min-w-[100px] flex-col gap-1">
      <div className="mb-0.5 text-[11px] font-bold text-white">{dateLabel}</div>
      {state === "unrecorded" ? (
        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>記録なし</div>
      ) : (
        <>
          <div className="flex justify-between gap-3 text-[10px]">
            <span style={{ color: "rgba(255,255,255,0.55)" }}>支出</span>
            <span className="font-mono text-white">{formatYen(expense)}</span>
          </div>
          <div className="flex justify-between gap-3 text-[10px]">
            <span style={{ color: "rgba(255,255,255,0.55)" }}>日予算</span>
            <span className="font-mono text-white">{formatYen(dailyBudget)}</span>
          </div>
          <div className="mt-0.5 flex justify-between gap-3 border-t border-white/10 pt-1 text-[10px]">
            {state === "achieved" ? (
              <>
                <span style={{ color: "#4ade80" }}>節約達成</span>
                <span className="font-mono font-bold" style={{ color: "#4ade80" }}>+{formatYen(saving)}</span>
              </>
            ) : (
              <>
                <span style={{ color: "#f43f5e" }}>超過</span>
                <span className="font-mono font-bold" style={{ color: "#f43f5e" }}>+{formatYen(over)}</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StreakTooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="flex cursor-default flex-col items-center gap-1"
          onClick={() => setOpen((v) => !v)}
        >
          {children}
        </button>
      </TooltipTrigger>
      {content && (
        <TooltipContent
          sideOffset={6}
          side="top"
          className="z-[100] shadow-xl"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {content}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

export function WeeklyStreak({ weeklyRecord, dailyBudget }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const budget = dailyBudget ?? 0;

  const { achieved: weekAchievedCount, recorded: weekRecordedCount } = countWeeklyAchievement(
    weeklyRecord,
    dailyBudget,
  );

  return (
    <TooltipProvider delayDuration={150}>
      <motion.div
        className="overflow-hidden rounded-2xl border p-4"
        style={{
          background: "var(--color-surface-default)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
            今週の記録
          </span>
          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{ color: "var(--foreground)", opacity: 0.42 }}
          >
            {weekAchievedCount} / {weekRecordedCount}日 節約達成
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeklyRecord.map((day) => {
            const isToday = day.date === todayStr;
            const streakState = weeklyStreakStateOf(day, dailyBudget, todayStr);
            const achieved = streakState === "achieved";
            const over = streakState === "over";
            const unrecorded = streakState === "unrecorded";

            let Icon;
            let color: string;
            if (achieved) {
              Icon = CheckCircle2;
              color = "var(--color-brand-primary)";
            } else if (over) {
              Icon = AlertCircle;
              color = "#f43f5e";
            } else if (unrecorded) {
              Icon = HelpCircle;
              color = "rgba(28,20,16,0.38)";
            } else {
              Icon = MinusCircle;
              color = "rgba(28,20,16,0.15)";
            }

            const tooltipContent = (
              <StreakTooltipContent
                dow={day.dow}
                date={day.date}
                state={streakState}
                expense={day.expense}
                dailyBudget={budget}
              />
            );
            const [, mm, dd] = day.date.split("-");
            const dateLabel = `${parseInt(mm)}/${parseInt(dd)}(${day.dow})`;
            return (
              <StreakTooltip key={day.date} content={streakState === "future" ? null : tooltipContent}>
                <span
                  className="text-[8px] font-semibold leading-none tabular-nums"
                  style={{ color: isToday ? "var(--color-brand-primary)" : "var(--foreground)", opacity: isToday ? 1 : 0.42 }}
                >
                  {dateLabel}
                </span>
                <Icon size={22} strokeWidth={2} style={{ color }} />
              </StreakTooltip>
            );
          })}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
