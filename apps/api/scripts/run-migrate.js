#!/usr/bin/env node
"use strict";

/**
 * Prisma マイグレーション実行スクリプト
 *
 * ECS Run Task でコンテナ起動時のエントリポイントとして使用する。
 * .bin/ の shell symlink は pnpm + Docker multi-stage build 環境で
 * 実行権限が解決されないため、require.resolve() で prisma CLI の
 * 実際のパスを取得して Node.js 自身で直接実行する。
 *
 * このスクリプトは /repo/apps/api/scripts/ に配置される。
 * WORKDIR = /repo/apps/api なので __dirname = /repo/apps/api/scripts
 */

const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

// このスクリプトを基準に apps/api ルートを確定する
const apiDir = path.resolve(__dirname, "..");

console.log("=== Prisma Migration Runner ===");
console.log("Node.js   :", process.execPath);
console.log("apiDir    :", apiDir);
console.log("DATABASE_URL defined:", !!process.env.DATABASE_URL);

// Node モジュール解決で prisma CLI の実際のパスを取得する
// { paths } オプションで検索開始ディレクトリを明示することで
// スクリプト配置場所に依存しない安定した解決を実現する
let prismaCli;
try {
	const prismaPkgPath = require.resolve("prisma/package.json", {
		paths: [apiDir],
	});
	const pkg = JSON.parse(fs.readFileSync(prismaPkgPath, "utf-8"));
	prismaCli = path.resolve(path.dirname(prismaPkgPath), pkg.bin.prisma);
	console.log("prisma pkg :", prismaPkgPath);
	console.log("prisma CLI :", prismaCli);
	console.log("CLI exists :", fs.existsSync(prismaCli));
} catch (err) {
	console.error("prisma CLI の特定に失敗しました:", err.message);
	process.exit(1);
}

// prisma migrate deploy を実行する
// stdio: 'inherit' で prisma のログを CloudWatch Logs に直接出力する
console.log("実行: prisma migrate deploy");
const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
	stdio: "inherit",
	cwd: apiDir,
	env: process.env,
});

if (result.error) {
	console.error("spawn エラー:", result.error.message);
	process.exit(1);
}

const exitCode = result.status ?? 1;
if (exitCode !== 0) {
	console.error(`マイグレーション失敗 (exit code: ${exitCode})`);
	process.exit(exitCode);
}

console.log("マイグレーション完了");
process.exit(0);
