// https://docs.expo.dev/develop/unit-testing/
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  // RN / Expo のパッケージは ESM のためトランスパイル対象に含める
  // （pnpm の node_modules/.pnpm/ 配下パスにも一致させる）
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/)?((jest-)?react-native|@react-native(-community)?|@react-native\\+.*|expo(nent)?|@expo(nent)?[/+].*|@expo-google-fonts/.*|react-navigation|@react-navigation[/+].*|native-base|react-native-svg))',
  ],
};
