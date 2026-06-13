import type { ElementType } from "react";
import type { CategoryColorToken } from "@budget/common";
import {
	ShoppingBasket, Utensils, Car, Zap, Smartphone,
	Building2, Landmark, Heart, Shield, ShoppingBag,
	GraduationCap, Scissors, Shirt, Music, Tag,
	CircleDashed, Banknote, Gift, Briefcase, Users,
	Wallet, TrendingUp,
} from "lucide-react";

export {
	EXPENSE_CATEGORY_TOKENS,
	EXPENSE_CATEGORY_ORDER,
	INCOME_CATEGORY_TOKENS,
	INCOME_CATEGORY_ORDER,
	getExpenseCategoryToken,
	getIncomeCategoryToken,
} from "@budget/common";
export type { CategoryColorToken } from "@budget/common";

/** アイコン付きカテゴリトークン（React コンポーネント向け） */
export type CategoryToken = CategoryColorToken & {
	icon: ElementType;
};

const ICON_MAP: Record<string, ElementType> = {
	food: ShoppingBasket,
	dining: Utensils,
	transport: Car,
	utility: Zap,
	telecom: Smartphone,
	housing: Building2,
	tax: Landmark,
	medical: Heart,
	insurance: Shield,
	daily: ShoppingBag,
	education: GraduationCap,
	beauty: Scissors,
	clothing: Shirt,
	leisure: Music,
	other: Tag,
	unclassified: CircleDashed,
	salary: Banknote,
	bonus: Gift,
	sideJob: Briefcase,
	pension: Users,
	benefit: Wallet,
	investment: TrendingUp,
};

/** カテゴリキーからアイコンを取得する */
export function getCategoryIcon(key: string): ElementType {
	return ICON_MAP[key] ?? Tag;
}
