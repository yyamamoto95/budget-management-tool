import { useQuery } from '@tanstack/react-query';
import type { components } from '@budget/api-client';
import { apiClient } from './client';

export type ReportPeriod = 'week' | 'month' | 'lastMonth';

/** レポート用の期間指定明細取得（Web /report と同じ period フィルタ） */
export function useReportExpenses(period: ReportPeriod) {
  return useQuery<components['schemas']['ExpenseResponse'][], Error>({
    queryKey: ['report-expenses', period],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/expense', {
        params: { query: { period } },
      });
      if (!data) {
        throw new Error(error?.message ?? 'レポートデータの取得に失敗しました');
      }
      return data.expense;
    },
  });
}
