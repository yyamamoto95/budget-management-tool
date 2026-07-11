import type { ImportCandidate } from '@budget/common';
import type { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import type { StatementScanService } from '../../services/import/StatementScanService';
import type { StatementAnalyzerSource } from '../../services/import/StatementAnalyzer';

/** 確認画面へ返す候補（既存明細との重複疑いを付与） */
export type AnalyzedCandidate = ImportCandidate & {
    /** 既存明細（手動・固定費自動登録を含む）と同日・同額・同収支のとき true */
    duplicateSuspect: boolean;
};

export type AnalyzeImportResult = {
    candidates: AnalyzedCandidate[];
    skippedRows: number;
    source: StatementAnalyzerSource;
};

export type AnalyzeImportInput = {
    userId: string;
    imageBase64: string;
    mimeType: string;
};

/**
 * スクショ一括取り込みの解析（#564 / #559 シナリオ1・3）。
 * 解析エンジン（#563）の候補列に、既存明細との重複疑いを付けて返す。
 * 重複疑いは除外ではなくマークに留め、含め直しはユーザーの判断に委ねる。
 */
export class AnalyzeImportUseCase {
    constructor(
        private readonly statementScanService: StatementScanService,
        private readonly expenseRepository: IExpenseRepository
    ) {}

    async execute(input: AnalyzeImportInput): Promise<AnalyzeImportResult> {
        const scan = await this.statementScanService.scan({
            imageBase64: input.imageBase64,
            mimeType: input.mimeType,
            userId: input.userId,
        });

        // 候補ゼロなら重複判定のクエリを省略して早期リターン（レビュー指摘対応）
        if (scan.candidates.length === 0) {
            return { candidates: [], skippedRows: scan.skippedRows, source: scan.source };
        }

        // 既存明細（未削除）と同日・同額・同収支なら重複疑い
        const expenses = await this.expenseRepository.findByUserId(input.userId);
        const existingKeys = new Set(
            expenses
                .filter((e) => !e.deletedDate)
                .map((e) => `${e.date}:${e.amount}:${e.balanceType}`)
        );

        const candidates = scan.candidates.map((candidate) => ({
            ...candidate,
            duplicateSuspect: existingKeys.has(
                `${candidate.date}:${candidate.amount}:${candidate.balanceType}`
            ),
        }));

        return { candidates, skippedRows: scan.skippedRows, source: scan.source };
    }
}
