import { generateKeyPairSync } from "node:crypto";
import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

// 統合テスト用環境変数を注入（テスト DB への接続情報）
config({ path: resolve(__dirname, ".env.test") });

// JWT 署名用 RSA 鍵の長さ（ビット）。開発用の鍵生成（scripts/gen-keys.ts）と同じ値に揃える
const JWT_RSA_MODULUS_LENGTH = 2048;

// JWT 署名用の RSA 鍵ペアは、リポジトリに固定値を置かず起動のたびに生成する。
// vitest のワーカーはこのプロセスの環境変数を引き継ぐため、全統合テストが同じ鍵ペアを共有できる。
// 外部から両方が指定されている場合はそれを優先し、片方だけの場合は不整合を避けて両方を生成し直す。
if (!process.env.JWT_PRIVATE_KEY || !process.env.JWT_PUBLIC_KEY) {
	const { privateKey, publicKey } = generateKeyPairSync("rsa", {
		modulusLength: JWT_RSA_MODULUS_LENGTH,
		privateKeyEncoding: { type: "pkcs8", format: "pem" },
		publicKeyEncoding: { type: "spki", format: "pem" },
	});
	// app.ts は "\\n" を改行へ戻して読むため、既存の鍵設定と同じ単一行形式で渡す
	process.env.JWT_PRIVATE_KEY = privateKey.replace(/\n/g, "\\n").trim();
	process.env.JWT_PUBLIC_KEY = publicKey.replace(/\n/g, "\\n").trim();
}

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
