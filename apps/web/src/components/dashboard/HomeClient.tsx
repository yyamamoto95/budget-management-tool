"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PAGE_VARIANTS, PAGE_ITEM_VARIANTS } from "@/lib/motion";
import type { DashboardResponse, CategoryItem } from "@/lib/api/types";
import { DailyBudgetHero } from "./DailyBudgetHero";
import { MonthlySummaryCard } from "./MonthlySummaryCard";
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
          />
        </motion.div>

        {/* PC: 2カラム / SP: 1カラム */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* WeeklyStreak */}
          <motion.div variants={PAGE_ITEM_VARIANTS}>
            <WeeklyStreak
              weeklyRecord={dashboard.weeklyRecord}
              dailyBudget={dashboard.dailyBudget?.amount ?? null}
            />
          </motion.div>

          {/* MonthlySummaryCard */}
          <motion.div variants={PAGE_ITEM_VARIANTS}>
            <MonthlySummaryCard
              monthSummary={dashboard.monthSummary}
              lastMonthExpense={dashboard.lastMonthExpense}
            />
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
      />
    </main>
  );
}
