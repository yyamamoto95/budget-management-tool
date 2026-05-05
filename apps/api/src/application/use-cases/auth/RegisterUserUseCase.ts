import { User } from '../../../domain/models/User';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { ISecurityAnswerRepository } from '../../../domain/repositories/ISecurityAnswerRepository';
import { ValidationError } from '../../../shared/errors/DomainException';

interface RegisterInput {
    /** ログインID兼PK（ユーザーが選択） */
    userId: string;
    /** 表示名（省略時はuserIdと同値） */
    displayName?: string;
    /** 平文パスワード */
    password: string;
    /** 秘密の質問ID */
    securityQuestionId: number;
    /** 秘密の質問の回答（平文） */
    securityAnswer: string;
}

export class RegisterUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly securityAnswerRepository: ISecurityAnswerRepository,
        private readonly passwordHasher: IPasswordHasher
    ) {}

    async execute(input: RegisterInput): Promise<User> {
        // ユーザーID重複チェック
        const existing = await this.userRepository.findById(input.userId);
        if (existing) {
            throw new ValidationError('そのユーザー名はすでに使用されています');
        }

        // ドメインエンティティ生成（バリデーション込み）
        const user = User.createWithId({
            userId: input.userId,
            userName: input.displayName ?? input.userId,
        });

        // アプリケーション層でハッシュ化してからリポジトリに渡す
        const hashedPassword = await this.passwordHasher.hash(input.password);
        const saved = await this.userRepository.create(user.withPassword(hashedPassword));

        // 秘密の質問と回答を保存
        await this.securityAnswerRepository.save(input.userId, input.securityQuestionId, input.securityAnswer);

        return saved;
    }
}
