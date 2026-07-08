import * as SecureStore from 'expo-secure-store';

/** OS のセキュア領域（iOS Keychain / Android Keystore）に保存するキー */
const ACCESS_TOKEN_KEY = 'budget.accessToken';
const REFRESH_TOKEN_KEY = 'budget.refreshToken';
const USER_ID_KEY = 'budget.userId';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  userId: string;
};

export async function saveSession(session: StoredSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
    SecureStore.setItemAsync(USER_ID_KEY, session.userId),
  ]);
}

export async function loadSession(): Promise<StoredSession | null> {
  const [accessToken, refreshToken, userId] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(USER_ID_KEY),
  ]);
  if (!accessToken || !refreshToken || !userId) {
    return null;
  }
  return { accessToken, refreshToken, userId };
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_ID_KEY),
  ]);
}
