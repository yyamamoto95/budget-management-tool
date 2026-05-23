import type { RefreshToken as RefreshTokenRecord } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { RefreshToken } from '../../domain/models/RefreshToken';
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';

/** Prisma の RefreshToken レコードをドメインモデルに変換する */
function toDomain(record: RefreshTokenRecord): RefreshToken {
    return RefreshToken.reconstruct({
        id: record.id,
        tokenHash: record.tokenHash,
        userId: record.userId,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
        createdAt: record.createdAt,
    });
}

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async save(token: RefreshToken): Promise<void> {
        await this.prisma.refreshToken.create({
            data: {
                id: token.id,
                tokenHash: token.tokenHash,
                userId: token.userId,
                expiresAt: token.expiresAt,
                revokedAt: token.revokedAt,
                createdAt: token.createdAt,
            },
        });
    }

    async findByHash(tokenHash: string): Promise<RefreshToken | null> {
        const record = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        return record ? toDomain(record) : null;
    }

    async revoke(id: string): Promise<void> {
        await this.prisma.refreshToken.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
    }

    async revokeAllByUserId(userId: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    async deleteExpired(): Promise<void> {
        await this.prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
    }
}
