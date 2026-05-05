import type { User } from '../models/User';
import type { UpdateUserInput } from '@budget/common';

export interface IUserRepository {
    /** 全ユーザーを取得する */
    findAll(): Promise<User[]>;

    /** userId でユーザーを取得する。存在しない場合は null */
    findById(userId: string): Promise<User | null>;

    /** email でユーザーを取得する。存在しない場合は null */
    findByEmail(email: string): Promise<User | null>;

    /**
     * 新規ユーザーを作成する。
     * user.password にはハッシュ済みパスワードがセットされていること。
     * ハッシュ化はアプリケーション層（UseCase）の責務。
     */
    create(user: User): Promise<User>;

    /**
     * ユーザー情報を更新する。
     * input.password を指定した場合のみパスワードを更新する（平文 → ハッシュ化はインフラ層）。
     */
    update(userId: string, input: UpdateUserInput): Promise<User>;

    /** ユーザーを削除する */
    remove(userId: string): Promise<void>;

    /**
     * パスワードを検証する（認証専用）。
     * @returns 一致する場合 true、不一致または存在しない場合 false
     */
    verifyPassword(userId: string, plaintextPassword: string): Promise<boolean>;
}
