import { describe, expect, it } from 'vitest';
import {
    extractReceiptDate,
    extractStoreName,
    extractTotalAmount,
} from '../../../../application/services/receipt/receiptTextParser';

const SAMPLE = `ローソン 品川店
2026/07/09 12:34
おにぎり鮭 150
お茶 500ml 120
サンドイッチ 380
小計 650
消費税(8%) 52
合計 ¥702
お預り 1,000
お釣り 298`;

describe('extractTotalAmount', () => {
    it('「合計」行の金額を抽出する（小計・お預り・お釣りは無視）', () => {
        expect(extractTotalAmount(SAMPLE)).toBe(702);
    });

    it('カンマ・全角円記号付きの金額を抽出できる', () => {
        expect(extractTotalAmount('合計 ￥1,234')).toBe(1234);
        expect(extractTotalAmount('ご合計 12,000円')).toBe(12000);
    });

    it('小計しかない場合は null（誤った金額を返さない）', () => {
        expect(extractTotalAmount('小計 650\nお預り 1,000')).toBeNull();
    });

    it('合計ポイントの行は対象外', () => {
        expect(extractTotalAmount('合計ポイント 25')).toBeNull();
    });
});

describe('extractReceiptDate', () => {
    it('スラッシュ区切りの日付を YYYY-MM-DD で返す', () => {
        expect(extractReceiptDate(SAMPLE)).toBe('2026-07-09');
    });

    it('和暦風（年月日）表記も抽出できる', () => {
        expect(extractReceiptDate('2026年7月9日')).toBe('2026-07-09');
    });

    it('不正な月日は null', () => {
        expect(extractReceiptDate('2026/13/45')).toBeNull();
    });

    it('日付がなければ null', () => {
        expect(extractReceiptDate('合計 702')).toBeNull();
    });
});

describe('extractStoreName', () => {
    it('先頭の意味のある行を店名として返す', () => {
        expect(extractStoreName(SAMPLE)).toBe('ローソン 品川店');
    });

    it('記号ノイズ行はスキップする', () => {
        expect(extractStoreName('****\n--- \nセブンイレブン')).toBe('セブンイレブン');
    });

    it('意味のある行がなければ null', () => {
        expect(extractStoreName('***\n123')).toBeNull();
    });
});
