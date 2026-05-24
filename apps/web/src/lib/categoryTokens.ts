import type { ElementType } from "react";
import {
  ShoppingBasket, Utensils, Car, Zap, Smartphone,
  Building2, Landmark, Heart, Shield, ShoppingBag,
  GraduationCap, Scissors, Shirt, Music, Tag,
  CircleDashed, Banknote, Gift, Briefcase, Users,
  Wallet, TrendingUp,
} from "lucide-react";

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

export function getCategoryIcon(key: string): ElementType {
  return ICON_MAP[key] ?? Tag;
}
