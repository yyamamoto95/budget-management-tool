import { describe, expect, it } from 'vitest';
import { applyKeypadKey, MAX_AMOUNT } from '../../utils/amountKeypad';

describe('applyKeypadKey', () => {
    it('数字キーを末尾へ追加する', () => {
        expect(applyKeypadKey('', '5')).toBe('5');
        expect(applyKeypadKey('12', '3')).toBe('123');
    });

    it('000 キーは3桁追加する', () => {
        expect(applyKeypadKey('5', '000')).toBe('5000');
    });

    it('空文字への 0 / 000 は無視する（0 始まりを作らない）', () => {
        expect(applyKeypadKey('', '0')).toBe('');
        expect(applyKeypadKey('', '000')).toBe('');
    });

    it('⌫ は末尾1文字を削除する', () => {
        expect(applyKeypadKey('123', '⌫')).toBe('12');
        expect(applyKeypadKey('', '⌫')).toBe('');
    });

    it('上限を超える入力は無視する', () => {
        expect(applyKeypadKey(String(MAX_AMOUNT), '0')).toBe(String(MAX_AMOUNT));
        expect(applyKeypadKey('9999999', '9')).toBe('9999999');
        // 境界: ちょうど上限は許可
        expect(applyKeypadKey('999999', '9')).toBe('9999999');
    });
});
