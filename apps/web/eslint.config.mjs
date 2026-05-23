// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Storybook ビルド出力（コミットしないが lint 対象外にする）
    "storybook-static/**",
  ]),
  ...storybook.configs["flat/recommended"],
  // shadcn/ui ラッパー強制ルール:
  // src/components/ui/ 配下のラッパーを経由せず Radix UI プリミティブや vaul を直接インポートすることを禁止する。
  // src/components/ui/ 自体はラッパー実装のため除外する。
  {
    files: ["**/*.{ts,tsx}"],
    // src/components/ui/ はラッパー実装のため除外。__tests__/**はモック目的のnamespace importが必要なため除外。
    ignores: ["**/components/ui/**", "**/__tests__/**", "**/*.stories.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              importNames: ["Toaster"],
              message:
                "Toaster を直接インポートせず @/components/ui/sonner の Toaster を使用してください。toast() 関数は直接インポート可です。",
            },
          ],
          patterns: [
            {
              group: ["@radix-ui/*"],
              message:
                "@radix-ui/* を直接インポートせず @/components/ui/* のラッパーコンポーネントを使用してください。新規コンポーネントが必要な場合は先に src/components/ui/ にラッパーを作成してください。",
            },
            {
              group: ["vaul"],
              message:
                "vaul を直接インポートせず @/components/ui/drawer を使用してください。",
            },
          ],
        },
      ],
    },
  },
  // セキュリティ・型安全強制ルール（本番コードのみ。テストはモック都合で一部除外）
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/__tests__/**", "**/*.stories.tsx", "**/components/ui/**"],
    rules: {
      // XSS 防止: dangerouslySetInnerHTML の直接使用を禁止する
      "react/no-danger": "error",
      // 任意コード実行防止: eval() / new Function() を禁止する
      "no-eval": "error",
      "no-new-func": "error",
      // XSS 防止: javascript: スキームを href に使用することを禁止する
      "no-script-url": "error",
      // 型安全: 'as any' キャストを禁止する（型定義を見直すこと）
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression[typeAnnotation.type='TSAnyKeyword']",
          message:
            "'as any' は禁止です。型定義を見直すか、unknown を使用してください。",
        },
      ],
      // 未使用変数・引数を警告ではなくエラーにする（本番コードに未使用コードを残さない）
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 変数宣言: const 優先・var 禁止
      "prefer-const": "error",
      "no-var": "error",
      // 可読性: ネスト三項演算子を禁止する
      "no-nested-ternary": "error",
      // デバッグコード禁止: console.log/debug を本番コードに残さない
      "no-console": ["error", { allow: ["error", "warn"] }],
      // 引数の数: 4つ以上はオブジェクト引数に変換する
      "max-params": ["error", 3],
    },
  },
]);

export default eslintConfig;
