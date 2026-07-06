/**
 * API 型定義。
 * openapi-typescript + @asteasolutions/zod-to-openapi により自動生成された
 * @budget/api-client の型を re-export する。
 * このファイルへの手動変更は禁止。型を変更する場合は以下を実行:
 *   pnpm generate:openapi && pnpm codegen
 */
export type {
    ExpenseResponse,
    GetExpensesResponse,
    GetExpenseResponse,
    LoginResponse,
    LogoutResponse,
    BudgetResponse,
    BudgetListResponse,
    BudgetDetailResponse,
    GetBudgetsResponse,
    GetBudgetResponse,
    UserSettingsResponse,
    UpsertUserSettingsBody,
    CategoryItem,
    CategoriesResponse,
} from "@budget/api-client";

/** 収支区分: 0=支出, 1=収入 */
export type BalanceType = 0 | 1;

// @budget/common からの既存 re-export を維持（後方互換）
export type { CreateExpenseInput } from "@budget/common";

/** ダッシュボード集約レスポンス（api-client に型が追加されるまでの暫定定義） */
export type DashboardResponse = {
  todayExpense: number;
  dailyBudget: {
    amount: number;
    remaining: number;
    ratio: number;
    daysUntilPayday: number;
  } | null;
  monthSummary: { expense: number; income: number };
  lastMonthExpense: number;
  weeklyRecord: Array<{
    date: string;
    dow: string;
    expense: number;
    recorded: boolean;
  }>;
  recentExpenses: import("@budget/api-client").ExpenseResponse[];
  streak: number;
  /** 生活余力の算出入力（計算は @budget/common calculateLivingMargin） */
  livingMargin: {
    totalAssets: number | null;
    avgDailyExpense: number;
    monthlyIncome: number;
    recordedDays: number;
  };
};
