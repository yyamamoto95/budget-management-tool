"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type LivingMarginContextValue = {
  /** 実効日次支出 E（円/日）。ダッシュボード未取得・算出不能時は null */
  effectiveDailyExpense: number | null;
  setEffectiveDailyExpense: (value: number | null) => void;
};

/**
 * 生活余力の実効日次支出 E を、ダッシュボード（HomeClient）から
 * レイアウト側の QuickEntryDrawer（BottomNav の FAB）へ届けるためのコンテキスト。
 * 支出登録直後の即時フィードバック（#418）に使用する。
 */
const LivingMarginContext = createContext<LivingMarginContextValue>({
  effectiveDailyExpense: null,
  setEffectiveDailyExpense: () => undefined,
});

export function LivingMarginProvider({ children }: { children: ReactNode }) {
  const [effectiveDailyExpense, setEffectiveDailyExpense] = useState<number | null>(null);
  return (
    <LivingMarginContext.Provider value={{ effectiveDailyExpense, setEffectiveDailyExpense }}>
      {children}
    </LivingMarginContext.Provider>
  );
}

export function useLivingMargin(): LivingMarginContextValue {
  return useContext(LivingMarginContext);
}
