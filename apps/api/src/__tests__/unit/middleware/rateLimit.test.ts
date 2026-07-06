import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { HonoEnv } from '../../../app';
import { createRateLimiter, type RateLimitRule } from '../../../presentation/middleware/rateLimit';

const MINUTE_MS = 60 * 1000;

/** 制御可能な時計とテスト用アプリを生成する */
function buildApp(rules: readonly RateLimitRule[], maxTrackedKeys?: number) {
    const clock = { current: 1_000_000 };
    const app = new Hono<HonoEnv>();
    app.use('/login', createRateLimiter({ rules, now: () => clock.current, maxTrackedKeys }));
    app.post('/login', (c) => c.json({ result: 'success' }, 200));
    return { app, clock };
}

function post(app: Hono<HonoEnv>, ip = '192.0.2.1') {
    return app.request('/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': ip },
    });
}

describe('createRateLimiter', () => {
    beforeEach(() => {
        delete process.env.RATE_LIMIT_DISABLED;
    });

    afterEach(() => {
        delete process.env.RATE_LIMIT_DISABLED;
    });

    it('制限内のリクエストのとき、200 を返す', async () => {
        const { app } = buildApp([{ windowMs: MINUTE_MS, limit: 5 }]);
        for (let i = 0; i < 5; i++) {
            const res = await post(app);
            expect(res.status).toBe(200);
        }
    });

    it('ウィンドウ内で制限を超過したとき、429 と Retry-After を返す', async () => {
        const { app } = buildApp([{ windowMs: MINUTE_MS, limit: 5 }]);
        for (let i = 0; i < 5; i++) {
            await post(app);
        }
        const res = await post(app);
        expect(res.status).toBe(429);
        expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
        const body = (await res.json()) as { result: string };
        expect(body.result).toBe('error');
    });

    it('ウィンドウが経過したとき、カウントがリセットされ再び受け付ける', async () => {
        const { app, clock } = buildApp([{ windowMs: MINUTE_MS, limit: 5 }]);
        for (let i = 0; i < 6; i++) {
            await post(app);
        }
        clock.current += MINUTE_MS;
        const res = await post(app);
        expect(res.status).toBe(200);
    });

    it('IP が異なるとき、それぞれ独立して制限される', async () => {
        const { app } = buildApp([{ windowMs: MINUTE_MS, limit: 5 }]);
        for (let i = 0; i < 5; i++) {
            await post(app, '192.0.2.1');
        }
        expect((await post(app, '192.0.2.1')).status).toBe(429);
        expect((await post(app, '192.0.2.2')).status).toBe(200);
    });

    it('x-forwarded-for が無いとき、共通キー扱いで制限が機能する', async () => {
        const { app } = buildApp([{ windowMs: MINUTE_MS, limit: 2 }]);
        const bare = () => app.request('/login', { method: 'POST' });
        await bare();
        await bare();
        expect((await bare()).status).toBe(429);
    });

    it('複数ルールのとき、短期ウィンドウが回復しても長期ウィンドウの超過で拒否する', async () => {
        const { app, clock } = buildApp([
            { windowMs: MINUTE_MS, limit: 5 },
            { windowMs: 60 * MINUTE_MS, limit: 8 },
        ]);
        // 1分あたり4回 × 2分で長期ルール(8回/時)に到達させる
        for (let cycle = 0; cycle < 2; cycle++) {
            for (let i = 0; i < 4; i++) {
                expect((await post(app)).status).toBe(200);
            }
            clock.current += MINUTE_MS;
        }
        // 短期ウィンドウはリセット済みだが長期ウィンドウが上限のため 429
        const res = await post(app);
        expect(res.status).toBe(429);
        // Retry-After は長期ウィンドウの残り時間（58分 = 3480秒）を反映する
        expect(Number(res.headers.get('Retry-After'))).toBe(58 * 60);
    });

    it('制限超過中のリクエストのとき、カウントを消費しない（ウィンドウ経過で確実に回復する）', async () => {
        const { app, clock } = buildApp([{ windowMs: MINUTE_MS, limit: 2 }]);
        await post(app);
        await post(app);
        // 超過リクエストを繰り返してもウィンドウ経過後は回復する
        for (let i = 0; i < 10; i++) {
            expect((await post(app)).status).toBe(429);
        }
        clock.current += MINUTE_MS;
        expect((await post(app)).status).toBe(200);
    });

    it('x-forwarded-for に偽装値が含まれるとき、末尾（信頼プロキシ付与）の IP で制限される', async () => {
        const { app } = buildApp([{ windowMs: MINUTE_MS, limit: 2 }]);
        // 先頭の偽装 IP をリクエストごとに変えても、末尾の実 IP が同じなら同一キー扱い
        await post(app, 'spoofed-a, 192.0.2.9');
        await post(app, 'spoofed-b, 192.0.2.9');
        const res = await post(app, 'spoofed-c, 192.0.2.9');
        expect(res.status).toBe(429);
    });

    it('キー数が上限を超えたとき、最も古いキーから削除される（FIFO・全件走査なし）', async () => {
        const { app } = buildApp([{ windowMs: MINUTE_MS, limit: 1 }], 2);
        // ip1 を上限まで使い切る
        await post(app, '192.0.2.1');
        expect((await post(app, '192.0.2.1')).status).toBe(429);
        // 新しいキーを2つ追加すると上限 2 を超え、最古の ip1 が追い出される
        await post(app, '192.0.2.2');
        await post(app, '192.0.2.3');
        // ip1 の状態はリセットされ、再び受け付ける
        expect((await post(app, '192.0.2.1')).status).toBe(200);
    });

    it('RATE_LIMIT_DISABLED=1 のとき、制限せずすべて通す', async () => {
        process.env.RATE_LIMIT_DISABLED = '1';
        const { app } = buildApp([{ windowMs: MINUTE_MS, limit: 1 }]);
        for (let i = 0; i < 10; i++) {
            expect((await post(app)).status).toBe(200);
        }
    });
});
