import { createRoute } from '@hono/zod-openapi';
import type { RouteServices } from '../../app';
import { createOpenAPIApp } from '../../lib/openapi-app';
import { DashboardResponseSchema, ErrorResponseSchema } from '../../openapi/schemas';
import { createAuthMiddleware } from '../middleware/auth';

const getDashboardRoute = createRoute({
    method: 'get',
    path: '/dashboard',
    tags: ['Dashboard'],
    summary: 'ダッシュボード集約データ取得',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            content: { 'application/json': { schema: DashboardResponseSchema } },
            description: 'ダッシュボードデータ',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

export function createDashboardRoutes({ tokenService, getDashboardUseCase }: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    app.use('/dashboard', auth);

    app.openapi(getDashboardRoute, async (c) => {
        const userId = c.get('userId');
        const result = await getDashboardUseCase.execute(userId);

        return c.json(
            {
                todayExpense: result.todayExpense,
                dailyBudget: result.dailyBudget,
                monthSummary: result.monthSummary,
                lastMonthExpense: result.lastMonthExpense,
                weeklyRecord: result.weeklyRecord,
                recentExpenses: result.recentExpenses.map((e) => ({
                    id: e.id,
                    amount: e.amount,
                    balanceType: e.balanceType,
                    userId: e.userId,
                    categoryId: e.categoryId,
                    content: e.content,
                    date: e.date,
                    createdDate: e.createdDate.toISOString(),
                    updatedDate: e.updatedDate.toISOString(),
                    deletedDate: e.deletedDate?.toISOString() ?? null,
                })),
                streak: result.streak,
                savingsGoal: result.savingsGoal,
                livingMargin: result.livingMargin,
            },
            200
        );
    });

    return app;
}
