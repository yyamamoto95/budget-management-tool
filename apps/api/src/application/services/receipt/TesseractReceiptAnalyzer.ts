import { recognize } from 'tesseract.js';
import type { ReceiptAnalyzeInput, ReceiptAnalyzer, ReceiptScanResult } from './ReceiptAnalyzer';
import { extractReceiptDate, extractStoreName, extractTotalAmount } from './receiptTextParser';

/**
 * 最終フォールバック: tesseract.js（無料・オフライン）で OCR し、ルールベースで抽出する。
 * 依存する外部サービスがないため常に利用可能。
 * 精度は Claude 系より劣るため、抽出できなかった項目は null を返しユーザーの手入力に委ねる。
 */
export class TesseractReceiptAnalyzer implements ReceiptAnalyzer {
    readonly source = 'ocr' as const;

    async isAvailable(): Promise<boolean> {
        return true;
    }

    async analyze(input: ReceiptAnalyzeInput): Promise<ReceiptScanResult> {
        const buffer = Buffer.from(input.imageBase64, 'base64');
        const {
            data: { text },
        } = await recognize(buffer, 'jpn');

        return {
            amount: extractTotalAmount(text),
            date: extractReceiptDate(text),
            content: extractStoreName(text),
            source: this.source,
        };
    }
}
