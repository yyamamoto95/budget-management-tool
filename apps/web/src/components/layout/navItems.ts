import { Home, Receipt, BarChart2, Settings } from "lucide-react";
import { NAV_ITEM_DEFS } from "@budget/common";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

/** key → アイコンの対応（SSOT は @budget/common の NAV_ITEM_DEFS。一致はテストで強制 #539） */
const NAV_ICON_MAP: Record<(typeof NAV_ITEM_DEFS)[number]["key"], React.ElementType> = {
  home: Home,
  records: Receipt,
  report: BarChart2,
  settings: Settings,
};

/** PC サイドバー・モバイルボトムナビ共通のナビゲーション定義 */
export const NAV_ITEMS: NavItem[] = NAV_ITEM_DEFS.map((def) => ({
  label: def.label,
  href: def.webPath,
  icon: NAV_ICON_MAP[def.key],
}));
