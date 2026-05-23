import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { createApp } from '../../app';
import { errorModel } from '../../domain/models/errorModel';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { TestAgent, testRequest } from '../helpers/testClient';

// --- テスト用 RSA 鍵ペア（テスト起動時に一度だけ生成） ---
let privateKeyPem: string;
let publicKeyPem: string;

beforeAll(() => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    privateKeyPem = privateKey;
    publicKeyPem = publicKey;
});

// --- モックリポジトリ ---
const mockUserRepository = {
    all: vi.fn(),
    one: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    login: vi.fn(),
} as unknown as IUserRepository;

const mockExpenseRepository = {
    findAll: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
} as unknown as IExpenseRepository;

const mockRefreshTokenRepository = {
    save: vi.fn(),
    findByHash: vi.fn(),
    revoke: vi.fn(),
    revokeAllByUserId: vi.fn(),
    deleteExpired: vi.fn(),
} as unknown as IRefreshTokenRepository;

function buildApp() {
    process.env.JWT_PRIVATE_KEY = privateKeyPem.replace(/\n/g, '\\n');
    process.env.JWT_PUBLIC_KEY = publicKeyPem.replace(/\n/g, '\\n');
    return createApp({
        userRepository: mockUserRepository,
        expenseRepository: mockExpenseRepository,
        refreshTokenRepository: mockRefreshTokenRepository,
    });
}

describe('POST /api/login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockRefreshTokenRepository.save).mockResolvedValue(undefined);
    });

    it('200: 正常ログイン成功 — accessToken と refreshToken を返す', async () => {
        vi.mocked(mockUserRepository.login).mockResolvedValue(true);
        const app = buildApp();

        const res = await testRequest(app, '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user-1', password: 'password123' }),
        });

        expect(res.status).toBe(200);
        const body = res.body as Record<string, unknown>;
        expect(body.result).toBe('success');
        expect(typeof body.accessToken).toBe('string');
        expect(typeof body.refreshToken).toBe('string');
        expect(body.userId).toBe('user-1');
    });

    it('400: userId が空ならバリデーションエラー', async () => {
        const app = buildApp();

        const res = await testRequest(app, '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: '', password: 'password123' }),
        });

        expect(res.status).toBe(400);
        expect((res.body as Record<string, unknown>).result).toBe('error');
    });

    it('400: password が未指定ならバリデーションエラー', async () => {
        const app = buildApp();

        const res = await testRequest(app, '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user-1' }),
        });

        expect(res.status).toBe(400);
        expect((res.body as Record<string, unknown>).result).toBe('error');
    });

    it('401: 認証失敗（パスワード不一致 / ユーザー不在）は同一レスポンスで返す', async () => {
        vi.mocked(mockUserRepository.login).mockResolvedValue(errorModel.AUTHENTICATION_FAILD);
        const app = buildApp();

        const res = await testRequest(app, '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user-1', password: 'wrong-pass' }),
        });

        expect(res.status).toBe(401);
        expect((res.body as Record<string, unknown>).result).toBe('error');
    });

    it('500: リポジトリが例外をスローした場合', async () => {
        vi.mocked(mockUserRepository.login).mockRejectedValue(new Error('DB error'));
        const app = buildApp();

        const res = await testRequest(app, '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user-1', password: 'password123' }),
        });

        expect(res.status).toBe(500);
    });
});

describe('POST /api/guest-login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockRefreshTokenRepository.save).mockResolvedValue(undefined);
    });

    it('200: ゲストユーザーが存在すればトークンを発行する', async () => {
        vi.mocked(mockUserRepository.one).mockResolvedValue({
            userId: 'Guest',
            userName: 'ゲスト',
            password: 'hashed',
        } as never);
        const app = buildApp();

        const res = await testRequest(app, '/api/guest-login', { method: 'POST' });

        expect(res.status).toBe(200);
        const body = res.body as Record<string, unknown>;
        expect(body.result).toBe('success');
        expect(typeof body.accessToken).toBe('string');
    });

    it('404: ゲストユーザーが存在しない', async () => {
        vi.mocked(mockUserRepository.one).mockResolvedValue(null);
        const app = buildApp();

        const res = await testRequest(app, '/api/guest-login', { method: 'POST' });

        expect(res.status).toBe(404);
    });
});

describe('POST /api/logout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockRefreshTokenRepository.save).mockResolvedValue(undefined);
        vi.mocked(mockRefreshTokenRepository.findByHash).mockResolvedValue(null);
    });

    it('200: refreshToken を渡してログアウト成功', async () => {
        vi.mocked(mockUserRepository.login).mockResolvedValue(true);
        const app = buildApp();
        const client = new TestAgent(app);

        await client.login('/api/login', {
            userId: 'user-1',
            password: 'password123',
        });
        const refreshToken = client.getRefreshToken();

        const res = await client.post('/api/logout', { refreshToken });
        expect(res.status).toBe(200);
        expect((res.body as Record<string, unknown>).result).toBe('success');
    });

    it('200: refreshToken なしでもログアウト成功（ベストエフォート）', async () => {
        const app = buildApp();

        const res = await testRequest(app, '/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(200);
    });
});

describe('POST /api/refresh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockRefreshTokenRepository.save).mockResolvedValue(undefined);
    });

    it('400: refreshToken が未指定', async () => {
        const app = buildApp();

        const res = await testRequest(app, '/api/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
    });

    it('401: 無効な refreshToken', async () => {
        vi.mocked(mockRefreshTokenRepository.findByHash).mockResolvedValue(null);
        const app = buildApp();

        const res = await testRequest(app, '/api/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: 'invalid-token' }),
        });

        expect(res.status).toBe(401);
    });
});

describe('認証済みルートのアクセス制御', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockRefreshTokenRepository.save).mockResolvedValue(undefined);
    });

    it('401: トークンなしで保護ルートにアクセス', async () => {
        const app = buildApp();

        const res = await testRequest(app, '/api/expense', { method: 'GET' });
        expect(res.status).toBe(401);
    });

    it('200: 有効なトークンで保護ルートにアクセス', async () => {
        vi.mocked(mockUserRepository.login).mockResolvedValue(true);
        vi.mocked(mockExpenseRepository.findAll).mockResolvedValue([]);
        const app = buildApp();
        const client = new TestAgent(app);

        await client.login('/api/login', {
            userId: 'user-1',
            password: 'password123',
        });
        const res = await client.get('/api/expense');
        expect(res.status).toBe(200);
    });
});
