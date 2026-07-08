import { clearSession, saveSession, type StoredSession } from './token-store';

/**
 * インメモリのセッションホルダー。
 * API クライアントのミドルウェアが同期的にトークンを参照できるようにする
 * （SecureStore は非同期のため、リクエストごとの読み出しを避ける）。
 */
let current: StoredSession | null = null;

/** セッション変更の購読者（AuthProvider が状態同期に使う） */
type Listener = (session: StoredSession | null) => void;
const listeners = new Set<Listener>();

export function getSession(): StoredSession | null {
  return current;
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * メモリと SecureStore の両方を更新する。
 * UI の即時更新のため、リスナー通知を先行させ SecureStore への永続化を後続で行う
 * （Keychain/Keystore 書き込みは数十〜数百 ms かかることがあり、画面遷移をブロックさせない）
 */
export async function setSession(session: StoredSession | null): Promise<void> {
  current = session;
  listeners.forEach((listener) => listener(session));
  if (session) {
    await saveSession(session);
  } else {
    await clearSession();
  }
}

/** 起動時の復元用（SecureStore からの読み出し結果をメモリへ反映するだけ） */
export function hydrateSession(session: StoredSession | null): void {
  current = session;
  listeners.forEach((listener) => listener(session));
}
