import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

// 統合テスト用環境変数を注入（テスト DB への接続情報）
config({ path: resolve(__dirname, ".env.test") });

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/__tests__/integration/**/*.test.ts"],
		// DB 状態の競合を防ぐため並列実行を無効化
		fileParallelism: false,
		deps: {
			interopDefault: true,
		},
	},
	resolve: {
		alias: {
			"@budget/common": resolve(
				__dirname,
				"../../packages/common/src/index.ts",
			),
			"@budget/api-client": resolve(
				__dirname,
				"../../packages/api-client/src/index.ts",
			),
		},
	},
});
