import type { CategoriesResponse } from "@budget/api-client";
import { serverFetch } from "./client";

/** 指定した収支タイプのカテゴリ一覧を取得する（Server Component 用） */
export async function getCategories(
  balanceType: 0 | 1,
): Promise<CategoriesResponse> {
  return serverFetch<CategoriesResponse>(
    `/api/categories?balanceType=${balanceType}`,
  );
}
