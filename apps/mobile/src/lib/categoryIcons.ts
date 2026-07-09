import type { ComponentType } from 'react';
import {
  Banknote,
  Briefcase,
  Building2,
  Car,
  CircleDashed,
  Gift,
  GraduationCap,
  Heart,
  Landmark,
  Music,
  Scissors,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Tag,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';

/**
 * カテゴリ key → アイコンコンポーネント（Web の lib/categoryTokens.ts と同一の対応）。
 * 対応の SSOT は @budget/common の CATEGORY_ICON_NAMES。
 * 乖離は __tests__/categoryIcons.test.ts が検出する（#537）。
 */
export const CATEGORY_ICON_MAP: Record<string, ComponentType<LucideProps>> = {
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

/** カテゴリ key からアイコンを取得する（未知 key は Tag にフォールバック） */
export function getCategoryIcon(key: string): ComponentType<LucideProps> {
  return CATEGORY_ICON_MAP[key] ?? Tag;
}
