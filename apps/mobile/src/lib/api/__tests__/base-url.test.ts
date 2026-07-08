import Constants from 'expo-constants';
import { resolveApiBaseUrl } from '../base-url';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: undefined as string | undefined } },
}));

describe('resolveApiBaseUrl', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    // undefined を代入すると文字列 "undefined" になるため delete で復元する
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalEnv;
    }
    (Constants.expoConfig as { hostUri?: string }).hostUri = undefined;
  });

  it('EXPO_PUBLIC_API_URL が設定されていれば最優先で返す', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
    (Constants.expoConfig as { hostUri?: string }).hostUri = '192.168.1.10:8081';
    expect(resolveApiBaseUrl()).toBe('https://api.example.com');
  });

  it('LAN 接続の hostUri から開発マシンの IP を導出する', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    (Constants.expoConfig as { hostUri?: string }).hostUri = '192.168.1.10:8081';
    expect(resolveApiBaseUrl()).toBe('http://192.168.1.10:5000');
  });

  it('トンネル接続（exp.direct）の hostUri は使わず localhost にフォールバックする', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    (Constants.expoConfig as { hostUri?: string }).hostUri = 'abc-anonymous-8081.exp.direct:80';
    // ポート付き hostUri の先頭要素はホスト名になる
    expect(resolveApiBaseUrl()).toBe('http://localhost:5000');
  });

  it('hostUri が無ければ localhost にフォールバックする', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(resolveApiBaseUrl()).toBe('http://localhost:5000');
  });
});
