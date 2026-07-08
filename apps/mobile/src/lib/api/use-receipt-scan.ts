import { useMutation } from '@tanstack/react-query';
import type { components } from '@budget/api-client';
import { apiClient } from './client';

export type ReceiptScanResult = components['schemas']['ReceiptScanResponse'];

export function useReceiptScan() {
  return useMutation({
    mutationFn: async (params: { imageBase64: string; mimeType: 'image/jpeg' | 'image/png' }) => {
      const { data, error } = await apiClient.POST('/api/receipt-scan', {
        body: { image: params.imageBase64, mimeType: params.mimeType },
      });
      if (!data) {
        throw new Error(error?.message ?? 'レシートの解析に失敗しました');
      }
      return data;
    },
  });
}
