import { createApp } from '../app';
import type { AppDeps } from '../app';

/**
 * スペック生成専用のスタブ依存関係。
 * ハンドラは実行されないため、全メソッドは未実装のままでよい。
 */
const stubDeps = {
    expenseRepository: {},
    budgetRepository: {},
    userRepository: {},
    refreshTokenRepository: {},
} as unknown as AppDeps;

/**
 * OpenAPI 3.0 ドキュメントを生成して返す。
 * generate-openapi.ts スクリプトから呼び出す。
 * ルート定義は createRoute() で宣言された情報から自動生成される。
 */
// biome-ignore lint/suspicious/noExplicitAny: OpenAPIObject 型は Record<string, unknown> に変換できないため
export function generateOpenAPIDocument(): any {
    const app = createApp(stubDeps);
    return app.getOpenAPIDocument({
        openapi: '3.0.0',
        info: {
            version: '1.0.0',
            title: '家計簿管理ツール API',
            description: '支出（Expense）の登録・管理を行う REST API。JWT Bearer 認証が必要。',
        },
        servers: [{ url: 'http://localhost:5000', description: 'ローカル開発' }],
    });
}
