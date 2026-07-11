/**
 * アプリ横断の構造定義（SSOT）。
 * Web / モバイルはこの定義からラベル・アイコン名を解決し、
 * 各プラットフォームの単体テストで一致を強制する（#539）。
 */

/** 収支区分（API スキーマ準拠） */
export const BALANCE_TYPE = { expense: 0, income: 1 } as const;
export type BalanceTypeValue = (typeof BALANCE_TYPE)[keyof typeof BALANCE_TYPE];

/** クイック記録のカテゴリ初期表示件数 */
export const CATEGORY_VISIBLE_COUNT = 4;

/** ナビゲーション定義（ラベル + lucide アイコン名 + Web パス） */
export const NAV_ITEM_DEFS = [
    // lucide の正史名は House（Home はエイリアス）。displayName 照合のため正史名で持つ
    { key: 'home', label: 'ホーム', iconName: 'House', webPath: '/' },
    { key: 'records', label: '明細', iconName: 'Receipt', webPath: '/records' },
    // BarChart2 の正史名は ChartNoAxesColumn
    { key: 'report', label: 'レポート', iconName: 'ChartNoAxesColumn', webPath: '/report' },
    { key: 'settings', label: '設定', iconName: 'Settings', webPath: '/settings' },
] as const;

/** 期間フィルタのラベル定義（明細・レポートで共通） */
export const PERIOD_LABELS = {
    week: '直近7日',
    month: '今月',
    lastMonth: '先月',
    all: '全期間',
} as const;
export type PeriodValue = keyof typeof PERIOD_LABELS;

/** レポート画面で選択できる期間（表示順） */
export const REPORT_PERIODS = ['week', 'month', 'lastMonth'] as const;
export type ReportPeriodValue = (typeof REPORT_PERIODS)[number];

/**
 * SP ホームのスワイプビュー構成（#576）。
 * Web（SP）とモバイルアプリの両方がこの定義を参照して描画し、構成のズレを防ぐ。
 * investment-capacity スライドは投資余力が算出不能のとき両プラットフォームとも非表示にする。
 */
export const HOME_CAROUSEL_SLIDES = [
    { key: 'margin-streak', label: '生活余力・今週の記録' },
    { key: 'savings-forecast', label: '今月の貯蓄予測' },
    { key: 'monthly-summary', label: '今月のサマリー' },
    { key: 'investment-capacity', label: '投資余力' },
] as const;
export type HomeCarouselSlideKey = (typeof HOME_CAROUSEL_SLIDES)[number]['key'];
