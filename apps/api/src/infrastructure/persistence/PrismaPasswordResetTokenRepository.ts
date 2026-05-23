import type { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';
import { createHash, randomBytes } from 'node:crypto';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/IPasswordResetTokenRepository';

/** トークンを SHA-256 でハッシュ化する（DBへの保存用） */
function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

/** リセットトークンの有効期限: 30分 */
const EXPIRES_IN_MS = 30 * 60 * 1000;

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async issue(userId: string): Promise<{ token: string; expiresAt: Date }> {
        // 既存の未使用トークンを失効させてから発行
        await this.prisma.passwordResetToken.updateMany({
            where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
            data: { usedAt: new Date() },
        });

        const token = randomBytes(32).toString('hex');
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + EXPIRES_IN_MS);

        await this.prisma.passwordResetToken.create({
            data: {
                id: ulid(),
                tokenHash,
                userId,
                expiresAt,
            },
        });

        return { token, expiresAt };
    }

    async verify(plainToken: string): Promise<string | null> {
        const tokenHash = hashToken(plainToken);
        const record = await this.prisma.passwordResetToken.findUnique({
            where: { tokenHash },
        });
        if (!record) return null;
        if (record.usedAt !== null) return null;
        if (record.expiresAt < new Date()) return null;
        return record.userId;
    }

    async consume(plainToken: string): Promise<void> {
        const tokenHash = hashToken(plainToken);
        await this.prisma.passwordResetToken.updateMany({
            where: { tokenHash },
            data: { usedAt: new Date() },
        });
    }
}
