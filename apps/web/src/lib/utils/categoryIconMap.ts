/**
 * カテゴリキー → lucide-react アイコン マッピング
 *
 * アイコンは React コンポーネントのため API 経由でシリアライズできない。
 * このマップで key を引いてアイコンを解決する（SSOT は apps/sandbox/src/tokens/categoryTokens.ts）。
 */
import type { ElementType } from "react";
import {
  CircleDashed,
  ShoppingBasket,
  Utensils,
  Car,
  Zap,
  Smartphone,
  Building2,
  Heart,
  Shield,
  ShoppingBag,
  Shirt,
  Music,
  Tag,
  Banknote,
  Gift,
  Briefcase,
  Users,
  Landmark,
  GraduationCap,
  Scissors,
  TrendingUp,
  Wallet,
} from "lucide-react";

const EXPENSE_ICON_MAP: Record<string, ElementType> = {
  food: ShoppingBasket,
  dining: Utensils,
  transport: Car,
  daily: ShoppingBag,
  utility: Zap,
  telecom: Smartphone,
  housing: Building2,
  tax: Landmark,
  medical: Heart,
  insurance: Shield,
  clothing: Shirt,
  beauty: Scissors,
  leisure: Music,
  education: GraduationCap,
  other: Tag,
  unclassified: CircleDashed,
};

const INCOME_ICON_MAP: Record<string, ElementType> = {
  salary: Banknote,
  bonus: Gift,
  sideJob: Briefcase,
  benefit: Wallet,
  pension: Users,
  investment: TrendingUp,
  other: Tag,
  unclassified: CircleDashed,
};

/**
 * カテゴリキーと収支タイプからアイコンコンポーネントを取得する。
 * 未知のキーは Tag にフォールバック。
 */
export function getCategoryIcon(
  key: string,
  balanceType: 0 | 1,
): ElementType {
  const map = balanceType === 0 ? EXPENSE_ICON_MAP : INCOME_ICON_MAP;
  return map[key] ?? Tag;
}
