import type { ComponentType } from 'react';
import { NAV_ITEM_DEFS } from '@budget/common';
import { BarChart2, Home, Receipt, Settings } from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';

/**
 * ナビ key → アイコンコンポーネント（Web navItems.ts と同一の対応）。
 * SSOT は @budget/common の NAV_ITEM_DEFS。乖離はテストで検出する（#539）。
 */
export const NAV_ICON_MAP: Record<
  (typeof NAV_ITEM_DEFS)[number]['key'],
  ComponentType<LucideProps>
> = {
  home: Home,
  records: Receipt,
  report: BarChart2,
  settings: Settings,
};
