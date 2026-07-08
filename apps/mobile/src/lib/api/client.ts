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
      const { data } = await publicClient.POST('/api/refresh', {
        body: { refreshToken: session.refreshToken },
      });
      if (!data) {
        // リフレッシュ失敗 = セッション失効。サインアウト状態へ落とす
        await setSession(null);
        return null;
      }
      const pair: TokenPairResponse = data;
      await setSession({
        accessToken: pair.accessToken,
        refreshToken: pair.refreshToken,
        userId: pair.userId,
      });
      return pair.accessToken;
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
