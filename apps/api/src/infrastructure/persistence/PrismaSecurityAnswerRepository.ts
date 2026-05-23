import type { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';
import type { ISecurityAnswerRepository } from '../../domain/repositories/ISecurityAnswerRepository';

// biome-ignore lint/suspicious/noExplicitAny: bcrypt は CommonJS モジュールのため require を使用
const bcrypt = require('bcrypt') as {
    hash: (data: string, rounds: number) => Promise<string>;
    compare: (data: string, encrypted: string) => Promise<boolean>;
};

export class PrismaSecurityAnswerRepository implements ISecurityAnswerRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async listQuestions(): Promise<{ id: number; text: string }[]> {
        return this.prisma.securityQuestionPreset.findMany({
            orderBy: { id: 'asc' },
        });
    }

    async findQuestionByUserId(userId: string): Promise<{ questionId: number; questionText: string } | null> {
        const answer = await this.prisma.userSecurityAnswer.findUnique({
            where: { userId },
            include: { question: true },
        });
        if (!answer) return null;
        return {
            questionId: answer.questionId,
            questionText: answer.question.text,
        };
    }

    async verifyAnswer(userId: string, plaintextAnswer: string): Promise<boolean> {
        const answer = await this.prisma.userSecurityAnswer.findUnique({
            where: { userId },
        });
        if (!answer) return false;
        return bcrypt.compare(plaintextAnswer.trim().toLowerCase(), answer.answerHash);
    }

    async save(userId: string, questionId: number, plaintextAnswer: string): Promise<void> {
        const answerHash = await bcrypt.hash(plaintextAnswer.trim().toLowerCase(), 10);
        await this.prisma.userSecurityAnswer.upsert({
            where: { userId },
            create: {
                id: ulid(),
                userId,
                questionId,
                answerHash,
            },
            update: {
                questionId,
                answerHash,
            },
        });
    }
}
