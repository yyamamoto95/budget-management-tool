import { serverFetch } from "./client";
import type { DashboardResponse } from "./types";

/** ダッシュボード集約データを取得する（Server Component 用） */
export async function getDashboard(): Promise<DashboardResponse> {
  return serverFetch<DashboardResponse>("/api/dashboard");
}
