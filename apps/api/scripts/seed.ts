/**
 * 開発環境用 Seed スクリプト
 *
 * DB マイグレーション完了後に実行し、アプリ起動に必要な初期データを投入する。
 *
 * 投入内容:
 *   - ゲストユーザー（userId: 'Guest'）: ゲストログイン機能に必須
 *
 * 冪等性: 既存レコードが存在する場合はスキップする（再実行安全）。
 *
 * 実行方法:
 *   pnpm --filter @budget/api run seed
 *
 * @see apps/api/src/presentation/routes/auth.ts - /guest-login ルート
 */

import * as path from 'node:path';
import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
}

// biome-ignore lint/suspicious/noExplicitAny: bcrypt は CommonJS モジュールのため require を使用
const bcrypt = require('bcrypt') as {
    hash: (data: string, rounds: number) => Promise<string>;
};

const GUEST_USER_ID = 'Guest';
const GUEST_USER_NAME = 'ゲスト';

async function seedGuestUser(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.userList.findUnique({
        where: { userId: GUEST_USER_ID },
    });
    if (existing) {
        console.log(`  → ゲストユーザーは既に存在します（スキップ）: userId=${GUEST_USER_ID}`);
        return;
    }

    // ゲストログインはパスワード不要だが、カラムは NOT NULL のためプレースホルダーを設定する
    const placeholderHash = await bcrypt.hash(`guest-placeholder-${Date.now()}`, 10);

    await prisma.userList.create({
        data: {
            userId: GUEST_USER_ID,
            userName: GUEST_USER_NAME,
            password: placeholderHash,
            role: 'GUEST',
            status: 'ACTIVE',
        },
    });

    console.log(`  ✅ ゲストユーザーを作成しました: userId=${GUEST_USER_ID}`);
}

async function main(): Promise<void> {
    console.log('');
    console.log('🌱 Seed データを投入しています...');

    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('  → DB 接続完了');

    try {
        await seedGuestUser(prisma);

        console.log('');
        console.log('✅ Seed 完了');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err: unknown) => {
    console.error('❌ Seed に失敗しました:', err instanceof Error ? err.message : err);
    process.exit(1);
});
