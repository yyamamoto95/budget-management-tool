"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { calculateLivingMargin } from "@budget/common";
import { PAGE_VARIANTS, PAGE_ITEM_VARIANTS } from "@/lib/motion";
import type { DashboardResponse, CategoryItem } from "@/lib/api/types";
import { DailyBudgetHero } from "./DailyBudgetHero";
import { InvestmentCapacityCard } from "./InvestmentCapacityCard";
import { LivingMarginCard } from "./LivingMarginCard";
import { useLivingMargin } from "@/components/providers/LivingMarginProvider";
import { MonthlySummaryCard } from "./MonthlySummaryCard";
import { SavingsForecastCard } from "./SavingsForecastCard";
import { WeeklyStreak } from "./WeeklyStreak";
import { RecentExpenses } from "./RecentExpenses";
import { QuickEntryDrawer } from "@/components/expense/QuickEntryDrawer";

type Props = {
  userId: string;
  dashboard: DashboardResponse;
  expenseCategories: CategoryItem[];
  incomeCategories: CategoryItem[];
  allCategories: CategoryItem[];
};

export function HomeClient({
  userId,
  dashboard,
  expenseCategories,
  incomeCategories,
  allCategories,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 生活余力（#418）。登録直後の即時フィードバック用に実効日次支出 E も導出する
  const livingMarginResult = calculateLivingMargin(dashboard.livingMargin);
  const effectiveDailyExpense =
    livingMarginResult.status === "ok" ? livingMarginResult.effectiveDailyExpense : null;

  // BottomNav（FAB）側の QuickEntryDrawer にも E と1日予算を届ける（レイアウト横断のためコンテキスト経由）
  const { setEffectiveDailyExpense, setDailyBudget } = useLivingMargin();
  const dailyBudgetAmount = dashboard.dailyBudget?.amount;
  const dailyBudgetRemaining = dashboard.dailyBudget?.remaining;
  useEffect(() => {
    setEffectiveDailyExpense(effectiveDailyExpense);
    // 値が変わらない限り参照を維持し、コンテキスト経由の不要な再レンダリングを避ける
    setDailyBudget((prev) => {
      if (dailyBudgetAmount === undefined || dailyBudgetRemaining === undefined) return null;
      if (prev && prev.amount === dailyBudgetAmount && prev.remaining === dailyBudgetRemaining) {
        return prev;
      }
      return { amount: dailyBudgetAmount, remaining: dailyBudgetRemaining };
    });
    return () => {
      setEffectiveDailyExpense(null);
      setDailyBudget(null);
    };
  }, [
    effectiveDailyExpense,
    setEffectiveDailyExpense,
    dailyBudgetAmount,
    dailyBudgetRemaining,
    setDailyBudget,
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 md:px-6 md:py-5">
      <motion.div
        variants={PAGE_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        {/* DailyBudgetHero — 全幅 */}
        <motion.div variants={PAGE_ITEM_VARIANTS} className="mb-4">
          <DailyBudgetHero
            dailyBudget={dashboard.dailyBudget}
            todayExpense={dashboard.todayExpense}
            monthSummary={dashboard.monthSummary}
            savingsGoal={dashboard.savingsGoal}
          />
        </motion.div>

        {/* PC: 2カラム / SP: 1カラム */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* LivingMarginCard — 生活余力（#418） */}
          <motion.div variants={PAGE_ITEM_VARIANTS}>
            <LivingMarginCard livingMargin={dashboard.livingMargin} />
          </motion.div>

          {/* WeeklyStreak */}
          <motion.div variants={PAGE_ITEM_VARIANTS}>
            <WeeklyStreak
              weeklyRecord={dashboard.weeklyRecord}
              dailyBudget={dashboard.dailyBudget?.amount ?? null}
            />
          </motion.div>

          {/* SavingsForecastCard — 今月の貯蓄予測（#458） */}
          <motion.div variants={PAGE_ITEM_VARIANTS}>
            <SavingsForecastCard
              monthSummary={dashboard.monthSummary}
              todayExpense={dashboard.todayExpense}
              savingsGoal={dashboard.savingsGoal}
            />
          </motion.div>

          {/* MonthlySummaryCard */}
          <motion.div variants={PAGE_ITEM_VARIANTS}>
            <MonthlySummaryCard
              monthSummary={dashboard.monthSummary}
              lastMonthExpense={dashboard.lastMonthExpense}
            />
          </motion.div>

          {/* InvestmentCapacityCard — 投資余力（#543 / #545）。算出不能時は非表示 */}
          <motion.div variants={PAGE_ITEM_VARIANTS}>
            <InvestmentCapacityCard livingMargin={dashboard.livingMargin} />
          </motion.div>
        </div>

        {/* RecentExpenses — 全幅 */}
        <motion.div variants={PAGE_ITEM_VARIANTS}>
          <RecentExpenses
            recentExpenses={dashboard.recentExpenses}
            allCategories={allCategories}
          />
        </motion.div>
      </motion.div>

      {/* QuickEntryDrawer */}
      <QuickEntryDrawer
        userId={userId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        effectiveDailyExpense={effectiveDailyExpense}
        dailyBudget={dashboard.dailyBudget}
      />
    </main>
  );
}
