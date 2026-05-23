import { ulid } from 'ulid';
import { createHash } from 'node:crypto';

/** リフレッシュトークンのドメインモデル */
export class RefreshToken {
    readonly id: string;
    readonly tokenHash: string;
    readonly userId: string;
    readonly expiresAt: Date;
    readonly revokedAt: Date | null;
    readonly createdAt: Date;

    private constructor(props: {
        id: string;
        tokenHash: string;
        userId: string;
        expiresAt: Date;
        revokedAt: Date | null;
        createdAt: Date;
    }) {
        this.id = props.id;
        this.tokenHash = props.tokenHash;
        this.userId = props.userId;
        this.expiresAt = props.expiresAt;
        this.revokedAt = props.revokedAt;
        this.createdAt = props.createdAt;
    }

    /** 新規トークンを生成する（生トークン文字列とドメインモデルを返す） */
    static create(userId: string, ttlSeconds: number): { token: string; domain: RefreshToken } {
        const token = ulid();
        const tokenHash = RefreshToken.hash(token);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

        return {
            token,
            domain: new RefreshToken({
                id: ulid(),
                tokenHash,
                userId,
                expiresAt,
                revokedAt: null,
                createdAt: now,
            }),
        };
    }

    /** 永続化済みデータから再構築する */
    static reconstruct(props: {
        id: string;
        tokenHash: string;
        userId: string;
        expiresAt: Date;
        revokedAt: Date | null;
        createdAt: Date;
    }): RefreshToken {
        return new RefreshToken(props);
    }

    /** トークン文字列を SHA-256 でハッシュ化する */
    static hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    get isExpired(): boolean {
        return this.expiresAt < new Date();
    }

    get isRevoked(): boolean {
        return this.revokedAt !== null;
    }

    get isValid(): boolean {
        return !this.isExpired && !this.isRevoked;
    }
}
