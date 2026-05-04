#!/usr/bin/env node
'use strict';

/**
 * Seed 実行スクリプト
 *
 * ECS Run Task でコンテナ起動時のエントリポイントとして使用する。
 * 冪等性があるため、デプロイのたびに実行しても安全。
 *
 * 投入内容:
 *   - ゲストユーザー（userId: 'Guest'）: ゲストログイン機能に必須
 *
 * WORKDIR = /repo/apps/api のため、ビルド成果物は
 * build/apps/api/scripts/seed.js に存在する。
 */

const path = require('path');
const { spawnSync } = require('child_process');

const apiDir = path.resolve(__dirname, '..');
const seedScript = path.join(apiDir, 'build', 'apps', 'api', 'scripts', 'seed.js');

console.log('=== Seed Runner ===');
console.log('Node.js    :', process.execPath);
console.log('apiDir     :', apiDir);
console.log('seedScript :', seedScript);
console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);

const result = spawnSync(process.execPath, [seedScript], {
    stdio: 'inherit',
    cwd: apiDir,
    env: process.env,
});

if (result.error) {
    console.error('spawn エラー:', result.error.message);
    process.exit(1);
}

const exitCode = result.status ?? 1;
if (exitCode !== 0) {
    console.error(`Seed 失敗 (exit code: ${exitCode})`);
    process.exit(exitCode);
}

console.log('Seed 完了');
process.exit(0);
