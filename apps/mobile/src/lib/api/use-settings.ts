import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from '@budget/api-client';
import { apiClient } from './client';

export type UserSettings = components['schemas']['UserSettingsResponse'];
export type UpsertSettingsBody = components['schemas']['UpsertUserSettingsBody'];

export function useSettings() {
  return useQuery<UserSettings, Error>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/settings');
      if (!data) {
        throw new Error(error?.message ?? '設定の取得に失敗しました');
      }
      return data;
    },
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpsertSettingsBody) => {
      const { data, error } = await apiClient.PUT('/api/settings', { body });
      if (!data) {
        throw new Error(error?.message ?? '設定の保存に失敗しました');
      }
      return data;
    },
    onSuccess: () => {
      // 1日予算・生活余力に即時反映させる
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
