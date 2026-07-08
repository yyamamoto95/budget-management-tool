import { useMutation } from '@tanstack/react-query';
import type { components } from '@budget/api-client';
import { apiClient } from './client';

export type ReceiptScanResult = components['schemas']['ReceiptScanResponse'];

/** 解析の待ち上限。CLI 経路（最大90秒）+ OCR フォールバックを見込む */
const SCAN_TIMEOUT_MS = 120_000;

export function useReceiptScan() {
  return useMutation({
    mutationFn: async (params: { imageBase64: string; mimeType: 'image/jpeg' | 'image/png' }) => {
      // スピナーが無限に続かないようクライアント側でも打ち切る
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
      try {
        const { data, error } = await apiClient.POST('/api/receipt-scan', {
          body: { image: params.imageBase64, mimeType: params.mimeType },
          signal: controller.signal,
        });
        if (!data) {
          throw new Error(error?.message ?? 'レシートの解析に失敗しました');
        }
        return data;
      } catch (e) {
        if (controller.signal.aborted) {
          throw new Error('解析がタイムアウトしました（2分）。通信環境を確認して再試行してください');
        }
        throw e;
      } finally {
        clearTimeout(timer);
      }
    },
  });
}
