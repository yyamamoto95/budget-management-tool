import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from '@budget/api-client';
import { apiClient } from './client';

export type Expense = components['schemas']['ExpenseResponse'];

/** 明細一覧（全期間・メモ検索対応、日付降順は API 既定） */
export function useExpenses(search: string) {
  return useQuery<Expense[], Error>({
    queryKey: ['expenses', search],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/expense', {
        params: { query: { period: 'all', ...(search ? { search } : {}) } },
      });
      if (!data) {
        throw new Error(error?.message ?? '明細の取得に失敗しました');
      }
      return data.expense;
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.DELETE('/api/expense/{id}', {
        params: { path: { id } },
      });
      if (!data) {
        throw new Error(error?.message ?? '削除に失敗しました');
      }
      return data;
    },
    onSuccess: () => {
      // 明細とホームの数値を即時反映させる
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
