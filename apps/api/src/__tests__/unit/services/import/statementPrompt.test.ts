import { describe, expect, it } from 'vitest';
import { parseClaudeStatementJson } from '../../../../application/services/import/statementPrompt';

function payload(rows: unknown[]): string {
    return JSON.stringify({ rows });
}

const validRow = {
    date: '2026-06-29',
    amount: 17504,
    balanceType: 0,
    content: 'ニホンガクセイシエンキ',
    categoryId: 6,
    confidence: 'high',
    raw: '29日 ニホンガクセイシエンキ -¥17,504',
};

describe('parseClaudeStatementJson', () => {
    it('有効な行を候補列に変換する', () => {
        const { candidates, skippedRows } = parseClaudeStatementJson(payload([validRow]));
        expect(skippedRows).toBe(0);
        expect(candidates).toEqual([
            {
                date: '2026-06-29',
                amount: 17504,
                balanceType: 0,
                content: 'ニホンガクセイシエンキ',
                categoryId: 6,
                confidence: 'high',
                raw: '29日 ニホンガクセイシエンキ -¥17,504',
            },
        ]);
    });

    it('入金行（balanceType=1）は収入カテゴリとして検証する', () => {
        const { candidates } = parseClaudeStatementJson(
            payload([{ ...validRow, balanceType: 1, categoryId: 1, content: 'ヤマモト ユウダイ', amount: 300000 }])
        );
        expect(candidates[0].balanceType).toBe(1);
        expect(candidates[0].categoryId).toBe(1); // 収入: 給料
        expect(candidates[0].confidence).toBe('high');
    });

    it('金額の文字列・マイナス・小数表記は正の整数に正規化する', () => {
        const { candidates } = parseClaudeStatementJson(
            payload([
                { ...validRow, amount: '-¥4,420' },
                { ...validRow, amount: -360 },
                { ...validRow, amount: '17504.00' },
            ])
        );
        expect(candidates.map((c) => c.amount)).toEqual([4420, 360, 17504]);
    });

    it('日付の前後空白に耐える', () => {
        const { candidates } = parseClaudeStatementJson(payload([{ ...validRow, date: ' 2026-06-29 ' }]));
        expect(candidates[0].date).toBe('2026-06-29');
    });

    it('日付・金額が読めない行と非オブジェクト行はスキップして数える', () => {
        const { candidates, skippedRows } = parseClaudeStatementJson(
            payload([
                validRow,
                { ...validRow, date: '6月29日' }, // 年なし → 不正
                { ...validRow, amount: 0 }, // 金額ゼロ → 不正
                { ...validRow, balanceType: 2 }, // 収支不正
                'ゴミ行',
            ])
        );
        expect(candidates).toHaveLength(1);
        expect(skippedRows).toBe(4);
    });

    it('実在しないカテゴリ ID は「その他」に落として要確認にする', () => {
        const { candidates } = parseClaudeStatementJson(payload([{ ...validRow, categoryId: 99 }]));
        expect(candidates[0].categoryId).toBe(0);
        expect(candidates[0].confidence).toBe('low');
    });

    it('カテゴリが「その他」のときは常に要確認にする', () => {
        const { candidates } = parseClaudeStatementJson(
            payload([{ ...validRow, categoryId: 0, confidence: 'high' }])
        );
        expect(candidates[0].confidence).toBe('low');
    });

    it('摘要が空の行は「（摘要なし）」で補完する', () => {
        const { candidates } = parseClaudeStatementJson(payload([{ ...validRow, content: '  ' }]));
        expect(candidates[0].content).toBe('（摘要なし）');
    });

    it('rows 配列がない・JSON がない応答はエラーにする', () => {
        expect(() => parseClaudeStatementJson('解析できませんでした')).toThrow('JSON が含まれていません');
        expect(() => parseClaudeStatementJson('{"total": 1}')).toThrow('rows 配列がありません');
    });

    it('前後に説明文が混ざっていても JSON 部分を取り出せる', () => {
        const text = `以下が結果です。\n${payload([validRow])}\n以上`;
        const { candidates } = parseClaudeStatementJson(text);
        expect(candidates).toHaveLength(1);
    });
});
