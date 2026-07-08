import { useQuery } from '@tanstack/react-query';
import type { components } from '@budget/api-client';
import { apiClient } from './client';

export type CategoryItem = components['schemas']['CategoryItem'];

/** 収支タイプ別のカテゴリ一覧（displayOrder 昇順）を取得する */
export function useCategories(balanceType: 0 | 1) {
  return useQuery<CategoryItem[], Error>({
    queryKey: ['categories', balanceType],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/categories', {
        params: { query: { balanceType: balanceType === 0 ? '0' : '1' } },
      });
      if (!data) {
        throw new Error(error?.message ?? 'カテゴリの取得に失敗しました');
      }
      return data;
    },
    // カテゴリはマスタデータのため画面遷移ごとの再取得を抑える
    staleTime: 5 * 60 * 1000,
  });
}
