import type { AutoFixedEntry } from '@budget/common';

/**
 * 固定費自動登録の永続化窓口（#552）。
 * 明細と冪等ログ（ユーザー × 年月で一意）を原子的に登録する。
 */
export interface IAutoFixedRegistrar {
    /**
     * 当該年月が未登録なら明細 + ログをトランザクションで登録して true を返す。
     * 既に登録済み（一意制約違反）の場合は何もせず false を返す。
     */
    registerOnce(userId: string, yearMonth: string, entries: AutoFixedEntry[]): Promise<boolean>;
}
