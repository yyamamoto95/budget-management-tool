import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenService } from '../../../application/auth/TokenService';
import { RefreshToken } from '../../../domain/models/RefreshToken';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function buildRepoMock(): IRefreshTokenRepository {
    return {
        save: vi.fn(async () => {}),
        findByHash: vi.fn(),
        revoke: vi.fn(async () => {}),
        revokeAllByUserId: vi.fn(async () => {}),
        deleteExpired: vi.fn(async () => {}),
    } as unknown as IRefreshTokenRepository;
}

describe('TokenService.rotateRefreshToken — リロード race 由来の誤った全セッション失効を防ぐ猶予窓', () => {
    let repo: IRefreshTokenRepository;
    let service: TokenService;

    beforeEach(() => {
        repo = buildRepoMock();
        service = new TokenService(privateKey, publicKey, repo);
    });

    it('未失効のトークンは通常通り rotation する（旧トークン失効 + 新トークン発行）', async () => {
        const token = 'raw-token-001';
        const stored = RefreshToken.reconstruct({
            id: 'rt-001',
            tokenHash: RefreshToken.hash(token),
            userId: 'user-001',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            revokedAt: null,
            createdAt: new Date(),
        });
        vi.mocked(repo.findByHash).mockResolvedValue(stored);

        const result = await service.rotateRefreshToken(token);

        expect(repo.revoke).toHaveBeenCalledWith('rt-001');
        expect(repo.revokeAllByUserId).not.toHaveBeenCalled();
        expect(result.userId).toBe('user-001');
        expect(typeof result.accessToken).toBe('string');
        expect(typeof result.refreshToken).toBe('string');
    });

    it('猶予窓内（< 10秒前）に失効済みトークンを受けたら新トークン発行のみ（全セッション失効しない）', async () => {
        // 1回のリロードで RSC + ページ取得が並行発生し、両方が同じ refresh token を消費する
        // race を再現するケース。片方が rotation 直後にもう片方が「失効済み」を踏むパターン。
        const token = 'raw-token-002';
        const stored = RefreshToken.reconstruct({
            id: 'rt-002',
            tokenHash: RefreshToken.hash(token),
            userId: 'user-002',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            revokedAt: new Date(Date.now() - 1000), // 1秒前に失効
            createdAt: new Date(),
        });
        vi.mocked(repo.findByHash).mockResolvedValue(stored);

        const result = await service.rotateRefreshToken(token);

        expect(repo.revokeAllByUserId).not.toHaveBeenCalled();
        expect(result.userId).toBe('user-002');
        expect(typeof result.accessToken).toBe('string');
        expect(typeof result.refreshToken).toBe('string');
    });

    it('猶予窓外（> 10秒前）に失効済みトークンを受けたら本物の再利用と判定し全セッション失効', async () => {
        const token = 'raw-token-003';
        const stored = RefreshToken.reconstruct({
            id: 'rt-003',
            tokenHash: RefreshToken.hash(token),
            userId: 'user-003',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            revokedAt: new Date(Date.now() - 60 * 1000), // 60秒前に失効
            createdAt: new Date(),
        });
        vi.mocked(repo.findByHash).mockResolvedValue(stored);

        await expect(service.rotateRefreshToken(token)).rejects.toThrow('REFRESH_TOKEN_REUSE_DETECTED');
        expect(repo.revokeAllByUserId).toHaveBeenCalledWith('user-003');
    });

    it('期限切れトークンは REFRESH_TOKEN_EXPIRED を投げ、全セッション失効はしない', async () => {
        const token = 'raw-token-004';
        const stored = RefreshToken.reconstruct({
            id: 'rt-004',
            tokenHash: RefreshToken.hash(token),
            userId: 'user-004',
            expiresAt: new Date(Date.now() - 1000),
            revokedAt: null,
            createdAt: new Date(),
        });
        vi.mocked(repo.findByHash).mockResolvedValue(stored);

        await expect(service.rotateRefreshToken(token)).rejects.toThrow('REFRESH_TOKEN_EXPIRED');
        expect(repo.revokeAllByUserId).not.toHaveBeenCalled();
    });

    it('存在しないトークンは INVALID_REFRESH_TOKEN を投げる', async () => {
        vi.mocked(repo.findByHash).mockResolvedValue(null);

        await expect(service.rotateRefreshToken('does-not-exist')).rejects.toThrow('INVALID_REFRESH_TOKEN');
    });
});
