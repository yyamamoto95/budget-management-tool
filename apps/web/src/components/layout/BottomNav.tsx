"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS } from "./navItems";
import type { NavItem } from "./navItems";
import { QuickEntryDrawer } from "@/components/expense/QuickEntryDrawer";
import type { CategoryItem } from "@/lib/api/types";

type Props = {
  userId?: string;
  expenseCategories: CategoryItem[];
  incomeCategories: CategoryItem[];
};

export function BottomNav({ userId, expenseCategories, incomeCategories }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // ナビ項目を中央のFABで2つに分割
  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);

  return (
    <>
      <QuickEntryDrawer
        userId={userId ?? ""}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
      />

      {/* ボトムナビゲーションバー（モバイルのみ表示） */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center border-t border-[#1c1410]/10 bg-white md:hidden"
        style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="モバイルナビゲーション"
      >
        {/* 左2項目 */}
        {leftItems.map((item) => (
          <BottomNavItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
          />
        ))}

        {/* 中央FABボタン */}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            aria-label={drawerOpen ? "メニューを閉じる" : "クイック記録"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="relative -top-3 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
            style={{
              background: "var(--color-brand-primary, #f08030)",
              boxShadow: "0 4px 16px rgba(240,128,48,0.4)",
            }}
          >
            {drawerOpen ? (
              <X size={22} className="text-white" />
            ) : (
              <Plus size={22} className="text-white" />
            )}
          </button>
        </div>

        {/* 右2項目 */}
        {rightItems.map((item) => (
          <BottomNavItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
          />
        ))}
      </nav>
    </>
  );
}

function BottomNavItem({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors"
      style={{ color: active ? "var(--color-brand-primary, #f08030)" : "rgba(28,20,16,0.4)" }}
    >
      <Icon size={22} />
      <span className="text-[10px] font-semibold">{item.label}</span>
    </Link>
  );
}
