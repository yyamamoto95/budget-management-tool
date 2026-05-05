/** パスワードのハッシュ化・検証を抽象化したドメインサービスインターフェース */
export interface IPasswordHasher {
    /** 平文パスワードをハッシュ化して返す */
    hash(plaintext: string): Promise<string>;
    /** 平文パスワードとハッシュを比較して一致するか検証する */
    verify(plaintext: string, hashed: string): Promise<boolean>;
}
