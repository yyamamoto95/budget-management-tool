import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { components } from '@budget/api-client';
import { apiClient } from './client';

type NewExpenseData = components['schemas']['CreateExpenseBody']['newData'];

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newData: NewExpenseData) => {
      const { data, error } = await apiClient.POST('/api/expense', {
        body: { newData },
      });
      if (!data) {
        throw new Error(error?.message ?? '記録の登録に失敗しました');
      }
      return data;
    },
    onSuccess: () => {
      // 登録直後にホームの数値へ即時反映させる
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
