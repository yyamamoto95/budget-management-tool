import Constants from 'expo-constants';

/**
 * API のベース URL を解決する。
 *
 * 優先順位:
 * 1. EXPO_PUBLIC_API_URL（明示指定。トンネル接続時は必須）
 * 2. Expo Go の hostUri から導出した開発マシンの LAN IP（LAN 接続時）
 * 3. localhost（シミュレーター / Web）
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv;
  }

  // LAN 接続の Expo Go では hostUri が「192.168.x.x:8081」形式になる。
  // トンネル接続（*.exp.direct）は API まで届かないため対象外
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && !host.endsWith('.exp.direct')) {
    return `http://${host}:5000`;
  }

  return 'http://localhost:5000';
}
