import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ReceiptAnalyzeInput, ReceiptAnalyzer, ReceiptScanResult } from './ReceiptAnalyzer';
import { RECEIPT_SYSTEM_PROMPT, parseClaudeReceiptJson } from './receiptPrompt';

const execFileAsync = promisify(execFile);

/** CLI 応答の待ち上限（画像解析は数十秒かかることがある） */
const CLI_TIMEOUT_MS = Number(process.env.RECEIPT_CLI_TIMEOUT_MS ?? 90_000);

const MIME_EXTENSION: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

/**
 * ローカル開発向け: claude CLI（Claude Code）をヘッドレス起動して解析する。
 * サブスクリプション枠内で動くため API 課金が発生しない。
 * CLI が無い環境（クラウド等）では isAvailable が false を返しスキップされる。
 */
export class ClaudeCliReceiptAnalyzer implements ReceiptAnalyzer {
    readonly source = 'claude-cli' as const;
    private availability: boolean | null = null;

    async isAvailable(): Promise<boolean> {
        if (process.env.RECEIPT_CLI_DISABLED === 'true') return false;
        if (this.availability !== null) return this.availability;
        try {
            await execFileAsync('claude', ['--version'], { timeout: 10_000 });
            this.availability = true;
        } catch {
            this.availability = false;
        }
        return this.availability;
    }

    async analyze(input: ReceiptAnalyzeInput): Promise<ReceiptScanResult> {
        const ext = MIME_EXTENSION[input.mimeType] ?? 'jpg';
        // パスはサーバー側で生成するためプロンプトインジェクションの余地はない
        const imagePath = join(tmpdir(), `receipt-${randomBytes(8).toString('hex')}.${ext}`);
        await writeFile(imagePath, Buffer.from(input.imageBase64, 'base64'));

        try {
            const prompt = `レシート画像 ${imagePath} を読み取ってください。${RECEIPT_SYSTEM_PROMPT}`;
            // execFile はシェルを経由しないため引数のエスケープ問題が発生しない
            const { stdout } = await execFileAsync(
                'claude',
                ['-p', prompt, '--allowedTools', 'Read', '--output-format', 'json'],
                { timeout: CLI_TIMEOUT_MS, maxBuffer: 1024 * 1024 }
            );

            const envelope: unknown = JSON.parse(stdout);
            const result =
                typeof envelope === 'object' && envelope !== null && 'result' in envelope
                    ? (envelope as { result: unknown }).result
                    : null;
            if (typeof result !== 'string') {
                throw new Error('claude CLI の応答形式が不正です');
            }

            return { ...parseClaudeReceiptJson(result), source: this.source };
        } finally {
            await unlink(imagePath).catch(() => {
                // 一時ファイルの削除失敗は解析結果に影響しないため握りつぶさずログのみ
                console.warn(`[ClaudeCliReceiptAnalyzer] 一時ファイルを削除できませんでした: ${imagePath}`);
            });
        }
    }
}
