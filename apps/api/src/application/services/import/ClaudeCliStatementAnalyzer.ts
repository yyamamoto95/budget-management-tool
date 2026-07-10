import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { StatementAnalyzeInput, StatementAnalyzer, StatementScanResult } from './StatementAnalyzer';
import { STATEMENT_SYSTEM_PROMPT, parseClaudeStatementJson } from './statementPrompt';

const execFileAsync = promisify(execFile);

/** CLI 応答の待ち上限（明細一覧の画像解析はレシートより時間がかかることがある） */
const CLI_TIMEOUT_MS = Number(process.env.STATEMENT_CLI_TIMEOUT_MS ?? 120_000);

const MIME_EXTENSION: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

/**
 * ローカル開発向け: claude CLI をヘッドレス起動して明細一覧を解析する。
 * サブスクリプション枠内で動くため API 課金が発生しない。
 * CLI が無い環境（クラウド等）では isAvailable が false を返しスキップされる。
 */
export class ClaudeCliStatementAnalyzer implements StatementAnalyzer {
    readonly source = 'claude-cli' as const;
    private availability: boolean | null = null;

    async isAvailable(): Promise<boolean> {
        if (process.env.STATEMENT_CLI_DISABLED === 'true') return false;
        if (this.availability !== null) return this.availability;
        try {
            await execFileAsync('claude', ['--version'], { timeout: 10_000 });
            this.availability = true;
        } catch {
            this.availability = false;
        }
        return this.availability;
    }

    async analyze(input: StatementAnalyzeInput): Promise<StatementScanResult> {
        const ext = MIME_EXTENSION[input.mimeType] ?? 'jpg';
        // パスはサーバー側で生成するためプロンプトインジェクションの余地はない
        const imagePath = join(tmpdir(), `statement-${randomBytes(8).toString('hex')}.${ext}`);
        // 明細は個人情報を含むため所有者のみ読める権限で書き込む
        await writeFile(imagePath, Buffer.from(input.imageBase64, 'base64'), { mode: 0o600 });

        try {
            const prompt = `明細一覧のスクリーンショット ${imagePath} を読み取ってください。${STATEMENT_SYSTEM_PROMPT}`;
            // execFile はシェルを経由しないため引数のエスケープ問題が発生しない
            const { stdout } = await execFileAsync(
                'claude',
                ['-p', prompt, '--allowedTools', 'Read', '--output-format', 'json'],
                { timeout: CLI_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 }
            );

            // npm 通知や Node の警告が stdout に混入しても JSON 部分だけを取り出す
            const envelopeMatch = stdout.match(/\{[\s\S]*\}/);
            if (!envelopeMatch) {
                throw new Error('claude CLI の応答に JSON が含まれていません');
            }
            const envelope: unknown = JSON.parse(envelopeMatch[0]);
            const result =
                typeof envelope === 'object' && envelope !== null && 'result' in envelope
                    ? (envelope as { result: unknown }).result
                    : null;
            if (typeof result !== 'string') {
                throw new Error('claude CLI の応答形式が不正です');
            }

            return { ...parseClaudeStatementJson(result), source: this.source };
        } finally {
            await unlink(imagePath).catch(() => {
                console.warn(`[ClaudeCliStatementAnalyzer] 一時ファイルを削除できませんでした: ${imagePath}`);
            });
        }
    }
}
