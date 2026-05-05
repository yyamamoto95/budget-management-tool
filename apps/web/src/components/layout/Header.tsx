"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { Home, Calendar, BarChart2, PenLine, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

// 通常ナビゲーション項目（記録するは CTA ボタンとして分離）
const NAV_ITEMS: NavItem[] = [
  { label: "ホーム", href: "/", icon: Home },
  { label: "カレンダー", href: "/calendar", icon: Calendar },
  { label: "レポート", href: "/report", icon: BarChart2 },
];

type Props = {
  userName?: string;
};

export function Header({ userName }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-[#1c1410]/10 bg-[#fffdf5]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#1c1410] bg-[#f18840] text-sm font-extrabold text-white"
            style={{ boxShadow: "var(--shadow-pop-sm)" }}
          >
            B
          </span>
          <span className="text-base font-bold text-[#1c1410]">家計簿</span>
        </Link>

        {/* デスクトップ: ナビゲーション */}
        <nav className="hidden md:flex items-center gap-1" aria-label="メインナビゲーション">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "relative flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors rounded-lg",
                  active
                    ? "text-[#f18840] bg-[#fff6ee]"
                    : "text-[#1c1410]/70 hover:text-[#f18840] hover:bg-[#fff6ee]",
                ].join(" ")}
              >
                <Icon size={15} />
                {item.label}
                {active && (
                  <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-[#f18840]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* デスクトップ: 右側エリア */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/expenses/new" className="btn-candy text-sm px-4 py-2">
            <PenLine size={14} />
            記録する
          </Link>
          {userName && (
            <span className="text-sm font-medium text-[#1c1410]/50">
              {userName}さん
            </span>
          )}
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost text-xs px-3 py-1.5 gap-1.5">
              <LogOut size={13} />
              ログアウト
            </button>
          </form>
        </div>

        {/* モバイル: 右側エリア */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/expenses/new" className="btn-candy text-xs px-3 py-1.5">
            <PenLine size={13} />
            記録する
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1c1410] transition-colors hover:bg-[#fff6ee]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* モバイル: ドロップダウンメニュー */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-[#1c1410]/10 bg-[#fffdf5] px-4 py-3"
          role="dialog"
          aria-label="モバイルメニュー"
        >
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "bg-[#fff6ee] text-[#f18840]"
                      : "text-[#1c1410] hover:bg-[#fff6ee] hover:text-[#f18840]",
                  ].join(" ")}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-2 flex items-center justify-between border-t border-[#1c1410]/8 pt-3">
            {userName && (
              <span className="text-sm font-medium text-[#1c1410]/50">
                {userName}さん
              </span>
            )}
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost text-xs px-3 py-1.5 gap-1.5">
                <LogOut size={13} />
                ログアウト
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
