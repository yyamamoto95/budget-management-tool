"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

/** 1日予算のスナップショット（「記録後の残り」プレビューに使用） */
export type DailyBudgetSnapshot = {
  /** 1日予算（円） */
  amount: number;
  /** 今日の残額（円） */
  remaining: number;
};

type LivingMarginContextValue = {
  /** 実効日次支出 E（円/日）。ダッシュボード未取得・算出不能時は null */
  effectiveDailyExpense: number | null;
  setEffectiveDailyExpense: (value: number | null) => void;
  /** 1日予算と今日の残額。設定未完了・ダッシュボード未取得時は null */
  dailyBudget: DailyBudgetSnapshot | null;
  setDailyBudget: (value: DailyBudgetSnapshot | null) => void;
};

/**
 * ダッシュボード（HomeClient）が持つ生活余力・1日予算の情報を、
 * レイアウト側の QuickEntryDrawer（BottomNav の FAB）へ届けるためのコンテキスト。
 * 支出登録直後の即時フィードバック（#418）と「記録後の残り」プレビュー（#461）に使用する。
 */
const LivingMarginContext = createContext<LivingMarginContextValue>({
  effectiveDailyExpense: null,
  setEffectiveDailyExpense: () => undefined,
  dailyBudget: null,
  setDailyBudget: () => undefined,
});

export function LivingMarginProvider({ children }: { children: ReactNode }) {
  const [effectiveDailyExpense, setEffectiveDailyExpense] = useState<number | null>(null);
  const [dailyBudget, setDailyBudget] = useState<DailyBudgetSnapshot | null>(null);
  return (
    <LivingMarginContext.Provider
      value={{ effectiveDailyExpense, setEffectiveDailyExpense, dailyBudget, setDailyBudget }}
    >
      {children}
    </LivingMarginContext.Provider>
  );
}

export function useLivingMargin(): LivingMarginContextValue {
  return useContext(LivingMarginContext);
}
