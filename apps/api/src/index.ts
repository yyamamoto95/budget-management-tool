import * as path from 'node:path';

if (process.env.NODE_ENV !== 'production') {
    // CWD は turbo 実行時に apps/api/ になるため、リポジトリルートの .env を明示的に指定する
    require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
}

import { serve } from '@hono/node-server';
import { prisma } from './infrastructure/persistence/prisma-client';
import { buildDeps } from './container';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 5000);

async function main(): Promise<void> {
    // Prisma 接続確認（DB に疎通できなければ早期終了）
    await prisma.$connect();

    const deps = buildDeps();
    const app = createApp(deps);

    serve({ fetch: app.fetch, port }, () => {
        console.log(`Hono server has started on port ${port}. Open http://localhost:${port}/api/docs`);
    });
}

main().catch((err: unknown) => {
    console.error('DB 接続に失敗しました:', err);
    process.exit(1);
});
