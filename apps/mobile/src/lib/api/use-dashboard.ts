import { useQuery } from '@tanstack/react-query';
import type { components } from '@budget/api-client';
import { apiClient } from './client';

export type DashboardData = components['schemas']['DashboardResponse'];

export function useDashboard() {
  return useQuery<DashboardData, Error>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/dashboard');
      if (!data) {
        throw new Error(error?.message ?? 'ダッシュボードの取得に失敗しました');
      }
      return data;
    },
  });
}
