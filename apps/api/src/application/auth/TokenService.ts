import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { RefreshToken } from '../../domain/models/RefreshToken';
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';

const ALGORITHM = 'RS256';
const ACCESS_TOKEN_TTL = 15 * 60; // 15分（秒）
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7日（秒）

export type JwtPayload = {
    sub: string; // userId
    jti: string; // JWT ID（ユニーク識別子）
};

export class TokenService {
    private privateKey: CryptoKey | null = null;
    private publicKey: CryptoKey | null = null;

    constructor(
        private readonly privateKeyPem: string,
        private readonly publicKeyPem: string,
        private readonly refreshTokenRepo: IRefreshTokenRepository
    ) {}

    private async getPrivateKey(): Promise<CryptoKey> {
        if (!this.privateKey) {
            this.privateKey = await importPKCS8(this.privateKeyPem, ALGORITHM);
        }
        return this.privateKey;
    }

    private async getPublicKey(): Promise<CryptoKey> {
        if (!this.publicKey) {
            this.publicKey = await importSPKI(this.publicKeyPem, ALGORITHM);
        }
        return this.publicKey;
    }

    /** アクセストークンを発行する */
    async signAccessToken(userId: string): Promise<string> {
        const { ulid } = await import('ulid');
        const privateKey = await this.getPrivateKey();

        return new SignJWT({ sub: userId, jti: ulid() })
            .setProtectedHeader({ alg: ALGORITHM })
            .setIssuedAt()
            .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
            .sign(privateKey);
    }

    /** アクセストークンを検証し、ペイロードを返す */
    async verifyAccessToken(token: string): Promise<JwtPayload> {
        const publicKey = await this.getPublicKey();
        const { payload } = await jwtVerify(token, publicKey, {
            algorithms: [ALGORITHM],
        });

        if (!payload.sub || !payload.jti) {
            throw new Error('invalid token payload');
        }

        return { sub: payload.sub, jti: payload.jti as string };
    }

    /** リフレッシュトークンを発行し、DBに保存する */
    async issueRefreshToken(userId: string): Promise<string> {
        const { token, domain } = RefreshToken.create(userId, REFRESH_TOKEN_TTL);
        await this.refreshTokenRepo.save(domain);
        return token;
    }

    /**
     * リフレッシュトークンを使って新しいトークンペアを発行する。
     * - 失効済みトークンが提示された場合は全セッションを即時無効化する（侵害検知）。
     * - 返り値は { accessToken, refreshToken }。
     */
    async rotateRefreshToken(rawToken: string): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
        const tokenHash = RefreshToken.hash(rawToken);
        const stored = await this.refreshTokenRepo.findByHash(tokenHash);

        if (!stored) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }

        if (stored.isRevoked) {
            // 失効済みトークンの再利用 → 侵害の可能性 → 全セッション無効化
            await this.refreshTokenRepo.revokeAllByUserId(stored.userId);
            throw new Error('REFRESH_TOKEN_REUSE_DETECTED');
        }

        if (stored.isExpired) {
            throw new Error('REFRESH_TOKEN_EXPIRED');
        }

        // ローテーション：旧トークンを失効させ、新トークンを発行
        await this.refreshTokenRepo.revoke(stored.id);

        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(stored.userId),
            this.issueRefreshToken(stored.userId),
        ]);

        return { accessToken, refreshToken, userId: stored.userId };
    }

    /** リフレッシュトークンを失効させる（ログアウト） */
    async revokeRefreshToken(rawToken: string): Promise<void> {
        const tokenHash = RefreshToken.hash(rawToken);
        const stored = await this.refreshTokenRepo.findByHash(tokenHash);
        if (stored) {
            await this.refreshTokenRepo.revoke(stored.id);
        }
    }
}
