import type { PrismaClient, UserList } from '@prisma/client';
import type { UpdateUserInput } from '@budget/common';
import { User } from '../../domain/models/User';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';

// biome-ignore lint/suspicious/noExplicitAny: bcrypt は CommonJS モジュールのため require を使用
const bcrypt = require('bcrypt') as {
    hash: (data: string, rounds: number) => Promise<string>;
    compare: (data: string, encrypted: string) => Promise<boolean>;
};

/** Prisma レコード → ドメインエンティティへの変換（インフラ型のドメイン層への漏洩防止） */
function toDomain(record: UserList): User {
    return User.reconstruct({
        userId: record.userId,
        userName: record.userName,
        password: record.password,
        email: record.email,
        role: record.role as User['role'],
        status: record.status as User['status'],
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    });
}

export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findAll(): Promise<User[]> {
        const records = await this.prisma.userList.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return records.map(toDomain);
    }

    async findById(userId: string): Promise<User | null> {
        const record = await this.prisma.userList.findUnique({ where: { userId } });
        return record ? toDomain(record) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const record = await this.prisma.userList.findUnique({ where: { email } });
        return record ? toDomain(record) : null;
    }

    async create(user: User): Promise<User> {
        const record = await this.prisma.userList.create({
            data: {
                userId: user.userId,
                userName: user.userName,
                email: user.email,
                password: user.password,
                role: user.role,
                status: user.status,
            },
        });
        return toDomain(record);
    }

    async update(userId: string, input: UpdateUserInput): Promise<User> {
        // Prisma の型に合わせてフィールドを個別に組み立てる
        const record = await this.prisma.userList.update({
            where: { userId },
            data: {
                ...(input.userName !== undefined && { userName: input.userName }),
                ...(input.email !== undefined && { email: input.email }),
                ...(input.role !== undefined && { role: input.role }),
                ...(input.status !== undefined && { status: input.status }),
                ...(input.password !== undefined && {
                    password: await bcrypt.hash(input.password, 10),
                }),
            },
        });
        return toDomain(record);
    }

    async remove(userId: string): Promise<void> {
        await this.prisma.userList.delete({ where: { userId } });
    }

    async verifyPassword(userId: string, plaintextPassword: string): Promise<boolean> {
        const record = await this.prisma.userList.findUnique({ where: { userId } });
        if (!record?.password) return false;
        return bcrypt.compare(plaintextPassword, record.password);
    }
}
