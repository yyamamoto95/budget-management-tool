import type { IPasswordHasher } from '../../domain/services/IPasswordHasher';

const bcrypt = require('bcrypt') as {
    hash: (data: string, rounds: number) => Promise<string>;
    compare: (data: string, encrypted: string) => Promise<boolean>;
};

export class BcryptPasswordHasher implements IPasswordHasher {
    async hash(plaintext: string): Promise<string> {
        return bcrypt.hash(plaintext, 10);
    }

    async verify(plaintext: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(plaintext, hashed);
    }
}
