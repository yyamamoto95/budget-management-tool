import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { publicClient } from '../api/client';
import { getSession, hydrateSession, setSession, subscribeSession } from './session';
import { loadSession } from './token-store';

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  status: AuthStatus;
  userId: string | null;
  login: (userId: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [userId, setUserId] = useState<string | null>(null);

  // 起動時に SecureStore からセッションを復元する
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSession();
      if (cancelled) return;
      hydrateSession(stored);
      setStatus(stored ? 'signedIn' : 'signedOut');
      setUserId(stored?.userId ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ミドルウェア側のセッション変化（リフレッシュ失敗による失効など）に追従する
  useEffect(() => {
    return subscribeSession((session) => {
      setStatus(session ? 'signedIn' : 'signedOut');
      setUserId(session?.userId ?? null);
    });
  }, []);

  const login = useCallback(
    async (loginUserId: string, password: string) => {
      try {
        const { data, error, response } = await publicClient.POST('/api/login', {
          body: { userId: loginUserId, password },
        });
        if (!data) {
          if (response.status === 429) {
            return { ok: false as const, message: 'ログイン試行が多すぎます。しばらく待ってから再試行してください' };
          }
          return { ok: false as const, message: error?.message ?? 'ユーザー名またはパスワードが違います' };
        }
        await setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          userId: data.userId,
        });
        return { ok: true as const };
      } catch {
        return { ok: false as const, message: 'サーバーに接続できません。ネットワークと API の起動状態を確認してください' };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const session = getSession();
    try {
      if (session) {
        // ベストエフォート: サーバー側のリフレッシュトークンを失効させる
        await publicClient.POST('/api/logout', {
          body: { refreshToken: session.refreshToken },
        });
      }
    } catch {
      // オフラインでもローカルのセッション破棄は続行する
    } finally {
      await setSession(null);
    }
  }, []);

  const value = useMemo(
    () => ({ status, userId, login, logout }),
    [status, userId, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth は AuthProvider の内側で使用してください');
  }
  return ctx;
}
