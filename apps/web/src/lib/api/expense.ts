import { serverFetch } from "./client";
import type { GetExpenseResponse, GetExpensesResponse } from "./types";

export type ExpenseQuery = {
  period?: "week" | "month" | "lastMonth" | "all";
  search?: string;
  date?: string;
  limit?: number;
  offset?: number;
};

/** 支出一覧を取得する（Server Component 用） */
export async function getExpenses(query?: ExpenseQuery): Promise<GetExpensesResponse> {
  const params = new URLSearchParams();
  if (query?.period) params.set("period", query.period);
  if (query?.search) params.set("search", query.search);
  if (query?.date) params.set("date", query.date);
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));
  const qs = params.toString();
  return serverFetch<GetExpensesResponse>(`/api/expense${qs ? `?${qs}` : ""}`);
}

/** ID を指定して支出を取得する（Server Component 用） */
export async function getExpense(id: string): Promise<GetExpenseResponse> {
  return serverFetch<GetExpenseResponse>(`/api/expense/${id}`);
}
