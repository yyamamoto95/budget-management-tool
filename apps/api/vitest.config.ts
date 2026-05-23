import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/__tests__/**/*.test.ts"],
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
