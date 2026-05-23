/**
 * 統合テスト用 DB ヘルパー
 *
 * 【冪等性の原則】
 * - resetDatabase(): 全テーブルを TRUNCATE し、テストケース間の状態汚染を防ぐ
 * - seedTestData(): 実ユースケースに基づく動的 ID でデータを投入する
 *   固定 ID のハードコードは禁止。ulid() で毎回一意の ID を生成すること。
 */

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

// ------------------------------------------------------------------
// テスト専用 Prisma クライアント
// DATABASE_URL は vitest.integration.config.ts で .env.test から注入済み
// ------------------------------------------------------------------
export const testPrisma = new PrismaClient({
    log: [],
});

// ------------------------------------------------------------------
// resetDatabase: 全テーブルを TRUNCATE し真っさらな状態に戻す
// beforeEach で呼び出すことで各テストの独立性を保証する
// ------------------------------------------------------------------
export async function resetDatabase(): Promise<void> {
    await testPrisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
    await testPrisma.$executeRawUnsafe('TRUNCATE TABLE budget_list');
    await testPrisma.$executeRawUnsafe('TRUNCATE TABLE user_list');
    await testPrisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
}

// ------------------------------------------------------------------
// シードパターン定義
// ------------------------------------------------------------------
export type SeedPattern =
    | 'minimal' // ログイン確認用の最小セット
    | 'lastMonthHeavyUser' // 前月に大量経費を申請したユーザー
    | 'managerUser' // 複数カテゴリを管理する管理職ユーザー
    | 'edgeCases'; // 実運用で起こり得るイレギュラーデータ

export type SeedResult = {
    users: Array<{ userId: string }>;
    budgets: Array<{ id: string }>;
};

// ------------------------------------------------------------------
// seedTestData: シナリオに応じたテストデータを動的に投入する
// ID は必ず ulid() で生成し、固定値のハードコードを禁止する
// ------------------------------------------------------------------
export async function seedTestData({ pattern }: { pattern: SeedPattern }): Promise<SeedResult> {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    switch (pattern) {
        // ----------------------------------------------------------
        // minimal: ログイン・セッション確認のための最小セット
        // ----------------------------------------------------------
        case 'minimal': {
            const user = await testPrisma.userList.create({
                data: {
                    userId: `test-${ulid()}`,
                    userName: 'テストユーザー',
                    password: hashedPassword,
                },
            });
            return { users: [{ userId: user.userId }], budgets: [] };
        }

        // ----------------------------------------------------------
        // lastMonthHeavyUser: 前月に大量の経費を申請したユーザー
        // ----------------------------------------------------------
        case 'lastMonthHeavyUser': {
            const user = await testPrisma.userList.create({
                data: {
                    userId: `heavy-${ulid()}`,
                    userName: '前月大量申請ユーザー',
                    password: hashedPassword,
                },
            });

            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthPrefix = lastMonth.toISOString().slice(0, 7);

            // 前月の支出 15 件（食費・交通費・通信費をローテーション）
            const expenseData = Array.from({ length: 15 }, (_, i) => {
                const day = String(i + 1).padStart(2, '0');
                return {
                    id: ulid(),
                    amount: 1000 + (i + 1) * 200,
                    balanceType: 0,
                    userId: user.userId,
                    categoryId: (i % 3) + 1,
                    content: `前月経費 ${i + 1} 件目`,
                    date: `${lastMonthPrefix}-${day}`,
                };
            });

            // 前月の給与（収入）
            expenseData.push({
                id: ulid(),
                amount: 300000,
                balanceType: 1,
                userId: user.userId,
                categoryId: 1,
                content: '前月給与',
                date: `${lastMonthPrefix}-25`,
            });

            const budgets = await testPrisma.$transaction(
                expenseData.map((data) => testPrisma.budgetList.create({ data }))
            );
            return {
                users: [{ userId: user.userId }],
                budgets: budgets.map((b) => ({ id: b.id })),
            };
        }

        // ----------------------------------------------------------
        // managerUser: 複数カテゴリを管理する管理職ユーザー
        // ----------------------------------------------------------
        case 'managerUser': {
            const manager = await testPrisma.userList.create({
                data: {
                    userId: `manager-${ulid()}`,
                    userName: '管理職ユーザー',
                    password: hashedPassword,
                },
            });

            const thisMonthPrefix = today.toISOString().slice(0, 7);
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthPrefix = lastMonth.toISOString().slice(0, 7);

            const entriesData = [
                // 今月の各プロジェクト経費（カテゴリ 1〜5）
                ...[1, 2, 3, 4, 5].map((cat) => ({
                    id: ulid(),
                    amount: 5000 * cat,
                    balanceType: 0,
                    userId: manager.userId,
                    categoryId: cat,
                    content: `プロジェクト ${cat} 経費`,
                    date: `${thisMonthPrefix}-0${cat}`,
                })),
                // 今月の給与
                {
                    id: ulid(),
                    amount: 500000,
                    balanceType: 1,
                    userId: manager.userId,
                    categoryId: 1,
                    content: '管理職給与（今月）',
                    date: `${thisMonthPrefix}-25`,
                },
                // 先月の交通費
                {
                    id: ulid(),
                    amount: 8000,
                    balanceType: 0,
                    userId: manager.userId,
                    categoryId: 2,
                    content: '先月出張交通費',
                    date: `${lastMonthPrefix}-20`,
                },
            ];

            const budgets = await testPrisma.$transaction(
                entriesData.map((data) => testPrisma.budgetList.create({ data }))
            );
            return {
                users: [{ userId: manager.userId }],
                budgets: budgets.map((b) => ({ id: b.id })),
            };
        }

        // ----------------------------------------------------------
        // edgeCases: 実運用で起こり得るイレギュラーなデータ
        // ----------------------------------------------------------
        case 'edgeCases': {
            const user = await testPrisma.userList.create({
                data: {
                    userId: `edge-${ulid()}`,
                    userName: 'エッジケースユーザー',
                    password: hashedPassword,
                },
            });

            const futureDate = new Date(today);
            futureDate.setMonth(today.getMonth() + 1);
            const futureDateStr = futureDate.toISOString().slice(0, 10);

            const edgeData = [
                {
                    id: ulid(),
                    amount: 1,
                    balanceType: 0,
                    userId: user.userId,
                    categoryId: 1,
                    content: '最小金額テスト',
                    date: todayStr,
                },
                {
                    id: ulid(),
                    amount: 10000,
                    balanceType: 0,
                    userId: user.userId,
                    categoryId: 2,
                    content: '未来日付テスト',
                    date: futureDateStr,
                },
                {
                    id: ulid(),
                    amount: 5000,
                    balanceType: 0,
                    userId: user.userId,
                    categoryId: 3,
                    content: 'あ'.repeat(250),
                    date: todayStr,
                },
                {
                    id: ulid(),
                    amount: 2000,
                    balanceType: 0,
                    userId: user.userId,
                    categoryId: 1,
                    content: null,
                    date: todayStr,
                },
            ];

            const budgets = await testPrisma.$transaction(
                edgeData.map((data) => testPrisma.budgetList.create({ data }))
            );
            return {
                users: [{ userId: user.userId }],
                budgets: budgets.map((b) => ({ id: b.id })),
            };
        }
    }
}
