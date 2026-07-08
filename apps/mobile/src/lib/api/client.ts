import { createApiClient, type TokenPairResponse } from '@budget/api-client';
import { resolveApiBaseUrl } from './base-url';
import { getSession, setSession } from '../auth/session';

const baseUrl = resolveApiBaseUrl();

/** 認証不要のエンドポイント（login / refresh / logout）用クライアント */
export const publicClient = createApiClient(baseUrl);

/**
 * リフレッシュの単一飛行制御。
 * 並行リクエストが同時に 401 を受けても /api/refresh は 1 回だけ実行する
 * （Refresh Token Rotation のため、二重実行すると再利用検知で失効する）。
 */
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const session = getSession();
      if (!session) {
        return null;
      }
      try {
        const { data, response } = await publicClient.POST('/api/refresh', {
          body: { refreshToken: session.refreshToken },
        });
        if (data) {
          const pair: TokenPairResponse = data;
          await setSession({
            accessToken: pair.accessToken,
            refreshToken: pair.refreshToken,
            userId: pair.userId,
          });
          return pair.accessToken;
        }
        // 401/403 = トークン失効・再利用検知の確定的な認証エラーのときだけサインアウトする
        if (response.status === 401 || response.status === 403) {
          await setSession(null);
        }
        return null;
      } catch {
        // ネットワーク断や一時的なサーバーエラーではセッションを維持する（次回リクエストで再試行）
        return null;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

/** 認証付き API クライアント。Bearer 付与と 401 時の自動リフレッシュ + 再試行を行う */
export const apiClient = createApiClient(baseUrl);

apiClient.use({
  async onRequest({ request }) {
    const session = getSession();
    if (session) {
      request.headers.set('Authorization', `Bearer ${session.accessToken}`);
    }
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status !== 401) {
      return response;
    }
    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
      return response;
    }
    // 新しいアクセストークンで元のリクエストを 1 回だけ再試行する
    const retried = new Request(request);
    retried.headers.set('Authorization', `Bearer ${newAccessToken}`);
    return fetch(retried);
  },
});
