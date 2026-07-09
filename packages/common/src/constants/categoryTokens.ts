/**
 * categoryTokens.ts — カテゴリ カラートークン SSOT
 *
 * ルール:
 *   - このファイルを唯一の真実の源 (SSOT) とする
 *   - 各ページで色を直書きせず、必ずこのトークンを参照する
 *   - トークンキーはセマンティクな英語名（日本語名と紐付けた lookup を使う）
 *   - color = アイコン/テキスト前景色、bg = バッジ/ボタン背景色
 *   - アイコンは React 依存のため、このパッケージには含めない
 *     → アイコン定義は apps/web/src/lib/categoryTokens.ts を参照
 */

// ── 型定義 ───────────────────────────────────────────────────────────────────

/** カテゴリカラートークン（アイコンなし・プラットフォーム非依存） */
export type CategoryColorToken = {
	/** セマンティクキー（英語）*/
	key: string;
	/** 表示名（日本語）*/
	name: string;
	/** アイコン / テキスト前景色 */
	color: string;
	/** バッジ / ボタン背景色 */
	bg: string;
};

// ── 支出カテゴリ ─────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORY_TOKENS: Record<string, CategoryColorToken> = {
	unclassified: {
		key: "unclassified",
		name: "未分類",
		color: "#94a3b8",
		bg: "#f1f5f9",
	},
	food: { key: "food", name: "食費", color: "#f18840", bg: "#fef5ee" },
	dining: { key: "dining", name: "外食", color: "#fb923c", bg: "#fff4ee" },
	transport: {
		key: "transport",
		name: "交通費",
		color: "#60a5fa",
		bg: "#eff6ff",
	},
	utility: { key: "utility", name: "光熱費", color: "#fbbf24", bg: "#fffbeb" },
	telecom: {
		key: "telecom",
		name: "通信費",
		color: "#818cf8",
		bg: "#eef2ff",
	},
	housing: {
		key: "housing",
		name: "住宅費",
		color: "#d97706",
		bg: "#fffbeb",
	},
	tax: { key: "tax", name: "税金", color: "#64748b", bg: "#f8fafc" },
	medical: {
		key: "medical",
		name: "医療費",
		color: "#fb7185",
		bg: "#fff1f2",
	},
	insurance: {
		key: "insurance",
		name: "保険",
		color: "#f472b6",
		bg: "#fdf2f8",
	},
	daily: { key: "daily", name: "日用品", color: "#38bdf8", bg: "#f0f9ff" },
	education: {
		key: "education",
		name: "教育費",
		color: "#eab308",
		bg: "#fefce8",
	},
	beauty: { key: "beauty", name: "美容費", color: "#e879f9", bg: "#fdf4ff" },
	clothing: {
		key: "clothing",
		name: "衣類",
		color: "#a78bfa",
		bg: "#f5f3ff",
	},
	leisure: { key: "leisure", name: "趣味", color: "#c084fc", bg: "#faf5ff" },
	other: { key: "other", name: "その他", color: "#94a3b8", bg: "#f8fafc" },
};

/** 支出カテゴリの表示順キー */
export const EXPENSE_CATEGORY_ORDER: string[] = [
	"food",
	"dining",
	"transport",
	"daily",
	"utility",
	"telecom",
	"housing",
	"tax",
	"medical",
	"insurance",
	"clothing",
	"beauty",
	"leisure",
	"education",
	"other",
	"unclassified",
];

// ── 収入カテゴリ ─────────────────────────────────────────────────────────────

export const INCOME_CATEGORY_TOKENS: Record<string, CategoryColorToken> = {
	unclassified: {
		key: "unclassified",
		name: "未分類",
		color: "#94a3b8",
		bg: "#f1f5f9",
	},
	salary: { key: "salary", name: "給料", color: "#2dd4bf", bg: "#f0fdfa" },
	bonus: { key: "bonus", name: "賞与", color: "#10b981", bg: "#ecfdf5" },
	sideJob: { key: "sideJob", name: "副業", color: "#22c55e", bg: "#f0fdf4" },
	benefit: { key: "benefit", name: "手当", color: "#0ea5e9", bg: "#f0f9ff" },
	pension: { key: "pension", name: "年金", color: "#14b8a6", bg: "#f0fdfa" },
	investment: {
		key: "investment",
		name: "投資・配当",
		color: "#34d399",
		bg: "#ecfdf5",
	},
	other: { key: "other", name: "その他", color: "#94a3b8", bg: "#f8fafc" },
};

/** 収入カテゴリの表示順キー */
export const INCOME_CATEGORY_ORDER: string[] = [
	"salary",
	"bonus",
	"sideJob",
	"benefit",
	"pension",
	"investment",
	"other",
	"unclassified",
];

// ── カテゴリ名 → トークン ルックアップ ───────────────────────────────────────

const EXPENSE_NAME_MAP: Record<string, string> = {
	未分類: "unclassified",
	住宅費: "housing",
	住居費: "housing",
	光熱費: "utility",
	電気代: "utility",
	ガス代: "utility",
	水道代: "utility",
	通信費: "telecom",
	スマホ: "telecom",
	サブスク: "telecom",
	税金: "tax",
	住民税: "tax",
	所得税: "tax",
	自動車税: "tax",
	固定資産税: "tax",
	保険: "insurance",
	食費: "food",
	交通費: "transport",
	交通: "transport",
	ガソリン: "transport",
	医療費: "medical",
	医療: "medical",
	薬: "medical",
	日用品: "daily",
	教育費: "education",
	教育: "education",
	塾: "education",
	参考書: "education",
	外食: "dining",
	カフェ: "dining",
	衣類: "clothing",
	美容費: "beauty",
	美容: "beauty",
	趣味: "leisure",
	その他: "other",
};

const INCOME_NAME_MAP: Record<string, string> = {
	未分類: "unclassified",
	給料: "salary",
	給与: "salary",
	月給: "salary",
	時給: "salary",
	残業代: "salary",
	賞与: "bonus",
	ボーナス: "bonus",
	決算賞与: "bonus",
	インセンティブ: "bonus",
	副業: "sideJob",
	フリーランス: "sideJob",
	業務委託: "sideJob",
	個人事業: "sideJob",
	手当: "benefit",
	住宅手当: "benefit",
	交通費支給: "benefit",
	扶養手当: "benefit",
	役職手当: "benefit",
	年金: "pension",
	老齢年金: "pension",
	障害年金: "pension",
	遺族年金: "pension",
	企業年金: "pension",
	投資: "investment",
	配当: "investment",
	配当金: "investment",
	分配金: "investment",
	家賃収入: "investment",
	売却益: "investment",
	収入: "salary",
	その他: "other",
	おこづかい: "other",
	所得: "other",
};

/**
 * 支出カテゴリ名からトークンを取得する。
 * 未知のカテゴリ名は `other` にフォールバック。
 */
export function getExpenseCategoryToken(name: string): CategoryColorToken {
	const key = EXPENSE_NAME_MAP[name] ?? "other";
	return EXPENSE_CATEGORY_TOKENS[key] ?? EXPENSE_CATEGORY_TOKENS.other;
}

/**
 * 収入カテゴリ名からトークンを取得する。
 * 未知のカテゴリ名は `other` にフォールバック。
 */
export function getIncomeCategoryToken(name: string): CategoryColorToken {
	const key = INCOME_NAME_MAP[name] ?? "other";
	return INCOME_CATEGORY_TOKENS[key] ?? INCOME_CATEGORY_TOKENS.other;
}

/**
 * カテゴリ key → lucide アイコン名の対応表（SSOT）。
 * Web は lucide-react、モバイルは lucide-react-native から同名アイコンを解決し、
 * 各プラットフォームの単体テストでこの表との一致を強制する（#537）。
 */
export const CATEGORY_ICON_NAMES = {
	food: 'ShoppingBasket',
	dining: 'Utensils',
	transport: 'Car',
	utility: 'Zap',
	telecom: 'Smartphone',
	housing: 'Building2',
	tax: 'Landmark',
	medical: 'Heart',
	insurance: 'Shield',
	daily: 'ShoppingBag',
	education: 'GraduationCap',
	beauty: 'Scissors',
	clothing: 'Shirt',
	leisure: 'Music',
	other: 'Tag',
	unclassified: 'CircleDashed',
	salary: 'Banknote',
	bonus: 'Gift',
	sideJob: 'Briefcase',
	pension: 'Users',
	benefit: 'Wallet',
	investment: 'TrendingUp',
} as const;

/** アイコン対応表のフォールバックアイコン名（未知のカテゴリ key 用） */
export const CATEGORY_FALLBACK_ICON_NAME = 'Tag' as const;
