import type { UserProps, UserRole, UserStatus } from '@budget/common';
import { ulid } from 'ulid';
import { ValidationError } from '../../shared/errors/DomainException';

export type { UserProps, UserRole, UserStatus };

/** メールアドレス形式の簡易チェック（RFC 5321 準拠の簡易版） */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ユーザーのドメインエンティティ（インフラ依存なし） */
export class User {
    readonly userId: string;
    readonly userName: string;
    /** bcrypt ハッシュ済みパスワード。ドメイン層で生パスワードは保持しない */
    readonly password: string;
    readonly email: string | null;
    readonly role: UserRole;
    readonly status: UserStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(props: UserProps) {
        this.userId = props.userId;
        this.userName = props.userName;
        this.password = props.password;
        this.email = props.email;
        this.role = props.role;
        this.status = props.status;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    /**
     * 新規ユーザーのファクトリメソッド。
     * ビジネスルール（不変条件）を検証してから生成する。
     * password フィールドは空文字で初期化 — 実際のハッシュはインフラ層で設定される。
     */
    static create(input: { userName: string; email?: string | null; role?: UserRole }): User {
        User.validateUserName(input.userName);
        if (input.email) {
            User.validateEmail(input.email);
        }

        return new User({
            userId: ulid(),
            userName: input.userName.trim(),
            password: '', // インフラ層がハッシュ化後に上書きする
            email: input.email ?? null,
            role: input.role ?? 'USER',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    /**
     * 自己登録用ファクトリメソッド。
     * userId をユーザーが指定する（ログインID兼PK）。
     */
    static createWithId(input: { userId: string; userName: string; email?: string | null; role?: UserRole }): User {
        User.validateUserId(input.userId);
        User.validateUserName(input.userName);
        if (input.email) {
            User.validateEmail(input.email);
        }

        return new User({
            userId: input.userId,
            userName: input.userName,
            password: '',
            email: input.email ?? null,
            role: input.role ?? 'USER',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    /**
     * DB から復元するファクトリメソッド（バリデーション省略）。
     * インフラ層（PrismaUserRepository）からのみ呼び出す。
     */
    static reconstruct(props: UserProps): User {
        return new User(props);
    }

    /**
     * ハッシュ済みパスワードをセットした新しいインスタンスを返す。
     * アプリケーション層で IPasswordHasher でハッシュ化してから呼び出す。
     */
    withPassword(hashedPassword: string): User {
        return new User({
            userId: this.userId,
            userName: this.userName,
            password: hashedPassword,
            email: this.email,
            role: this.role,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        });
    }

    // ─── バリデーション（ドメイン不変条件） ─────────────────────
    private static validateUserId(userId: string): void {
        if (!/^[a-zA-Z0-9_-]{3,30}$/.test(userId)) {
            throw new ValidationError('ユーザーIDは半角英数字・アンダースコア・ハイフンで3〜30文字で入力してください');
        }
    }

    private static validateUserName(userName: string): void {
        const trimmed = userName.trim();
        if (trimmed.length === 0) {
            throw new ValidationError('ユーザー名を入力してください');
        }
        if (trimmed.length > 50) {
            throw new ValidationError('ユーザー名は50文字以内で入力してください');
        }
    }

    private static validateEmail(email: string): void {
        if (!EMAIL_REGEX.test(email)) {
            throw new ValidationError(`メールアドレスの形式が不正です: ${email}`);
        }
    }
}
