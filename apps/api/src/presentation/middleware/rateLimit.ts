import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../../app';

/** 固定ウィンドウ方式の制限ルール */
export interface RateLimitRule {
    /** ウィンドウ長（ミリ秒） */
    windowMs: number;
    /** ウィンドウ内で許容するリクエスト数 */
    limit: number;
}

export interface RateLimiterOptions {
    /** 複数ルールはすべて満たす必要がある（例: 5回/分 かつ 20回/時間） */
    rules: readonly RateLimitRule[];
    /** 現在時刻（エポックミリ秒）の取得関数。テストで時刻を制御するために注入可能 */
    now?: () => number;
}

/** ルールごとの固定ウィンドウ状態 */
interface WindowState {
    windowStart: number;
    count: number;
}

/** 追跡するクライアントキー数の上限。超過時に失効エントリを掃除してメモリを抑制する */
const MAX_TRACKED_KEYS = 10_000;

/**
 * 認証エンドポイント向けの in-memory レートリミッター（ブルートフォース対策）。
 * シングルインスタンス構成のため外部ストア（Redis 等）は使用しない。
 *
 * - クライアントの識別は `x-forwarded-for` の先頭 IP（CloudFront/ALB 経由を想定）
 * - 超過時は 429 を返し、`Retry-After` ヘッダーで再試行可能秒数を通知する
 * - 制限超過中のリクエストもカウントしない（固定ウィンドウの残数はウィンドウ更新でのみ回復）
 * - `RATE_LIMIT_DISABLED=1` で無効化できる（統合テスト・E2E がログイン失敗ケースを
 *   繰り返し実行するため。本番環境では設定しないこと）
 */
export const createRateLimiter = ({ rules, now = Date.now }: RateLimiterOptions) => {
    const states = new Map<string, WindowState[]>();

    // 全ルールのウィンドウが失効したキーを削除する（キー数が上限を超えたときのみ実行）
    const sweepStaleKeys = (current: number) => {
        if (states.size <= MAX_TRACKED_KEYS) return;
        for (const [key, windows] of states) {
            const allStale = windows.every((w, i) => {
                const rule = rules[i];
                return rule === undefined || current - w.windowStart >= rule.windowMs;
            });
            if (allStale) states.delete(key);
        }
    };

    return createMiddleware<HonoEnv>(async (c, next) => {
        if (process.env.RATE_LIMIT_DISABLED === '1') {
            await next();
            return;
        }

        const forwardedFor = c.req.header('x-forwarded-for');
        const key = forwardedFor?.split(',')[0]?.trim() || 'unknown';
        const current = now();
        sweepStaleKeys(current);

        let windows = states.get(key);
        if (windows === undefined) {
            windows = rules.map(() => ({ windowStart: current, count: 0 }));
            states.set(key, windows);
        }

        // 失効したウィンドウをリセットし、超過ルールの再試行可能時刻を求める
        let retryAfterMs = 0;
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            const w = windows[i];
            if (rule === undefined || w === undefined) continue;

            if (current - w.windowStart >= rule.windowMs) {
                w.windowStart = current;
                w.count = 0;
            }
            if (w.count >= rule.limit) {
                retryAfterMs = Math.max(retryAfterMs, w.windowStart + rule.windowMs - current);
            }
        }

        if (retryAfterMs > 0) {
            c.header('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
            return c.json(
                {
                    result: 'error' as const,
                    message: 'リクエストが多すぎます。しばらく待ってから再試行してください',
                },
                429
            );
        }

        for (const w of windows) {
            w.count += 1;
        }
        await next();
    });
};
