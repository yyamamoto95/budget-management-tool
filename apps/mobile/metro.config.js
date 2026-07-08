// pnpm モノレポ向け Metro 設定（https://docs.expo.dev/guides/monorepos/）
// pnpm の非フラットな node_modules では、expo-router 等のパッケージ内部からの
// 相対解決が失敗するため、アプリとワークスペースルートの node_modules を明示する
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
