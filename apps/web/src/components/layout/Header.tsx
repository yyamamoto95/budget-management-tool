"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { PenLine, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { memo, useState } from "react";
import { NAV_ITEMS } from "./navItems";

const LogoImage = memo(function LogoImage({
  size,
  style,
}: {
  size: number;
  style?: React.CSSProperties;
}) {
  return (
    <Image
      src="/logo192.png"
      alt="家計かんり"
      width={size}
      height={size}
      style={style}
    />
  );
});

type Props = {
  userName?: string;
};

export function Header({ userName }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ─── PC: 左サイドバー（md以上） ─────────────────────────── */}
      <aside
        className="hidden md:flex flex-col border-r border-[#1c1410]/10 bg-[#fffdf5] sticky top-0 h-screen transition-[width] duration-200 flex-shrink-0 z-20"
        style={{ width: collapsed ? 64 : 220 }}
        aria-label="サイドバーナビゲーション"
      >
        {/* ロゴ */}
        <div className="flex h-14 items-center justify-center border-b border-[#1c1410]/10 px-3">
          {collapsed ? (
            <LogoImage size={32} style={{ boxShadow: "0 1px 4px rgba(28,20,16,0.08)" }} />
          ) : (
            <Link href="/" className="flex items-center gap-2 w-full">
              <LogoImage size={32} style={{ flexShrink: 0, boxShadow: "0 1px 4px rgba(28,20,16,0.08)" }} />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-extrabold text-[#1c1410]">家計かんり</span>
                <span className="text-[10px] text-[#1c1410]/40">家計を、もっとシンプルに。</span>
              </div>
            </Link>
          )}
        </div>

        {/* ナビゲーション */}
        <nav className="flex flex-col gap-1 px-2 pt-3 flex-1" aria-label="メインナビゲーション">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  collapsed ? "justify-center" : "gap-3",
                  active
                    ? "bg-[#fff6ee] text-[#f18840]"
                    : "text-[#1c1410]/70 hover:bg-[#fff6ee] hover:text-[#f18840]",
                ].join(" ")}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* 記録するボタン */}
        <div className="px-2 pb-3">
          <Link
            href="/expenses/new"
            className={[
              "btn-candy flex w-full items-center rounded-xl py-2.5 text-sm",
              collapsed ? "justify-center px-0" : "gap-2 px-3",
            ].join(" ")}
            title={collapsed ? "記録する" : undefined}
          >
            <PenLine size={16} className="flex-shrink-0" />
            {!collapsed && "記録する"}
          </Link>
        </div>

        {/* ユーザー・ログアウト */}
        <div className="border-t border-[#1c1410]/10 px-2 py-3 flex items-center gap-2">
          {!collapsed && userName && (
            <span className="flex-1 truncate rounded-full border border-[#1c1410]/10 bg-[#fff6ee] px-3 py-1 text-xs font-semibold text-[#1c1410]/70">
              {userName}
            </span>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#1c1410]/50 hover:bg-[#fff6ee] hover:text-[#1c1410] transition-colors"
              title={collapsed ? "ログアウト" : undefined}
            >
              <LogOut size={14} />
              {!collapsed && "ログアウト"}
            </button>
          </form>
        </div>

        {/* 折りたたみトグル */}
        <button
          type="button"
          aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center justify-center border-t border-[#1c1410]/10 py-2 text-[#1c1410]/30 hover:bg-[#fff6ee] hover:text-[#f18840] transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* ─── モバイル: ミニヘッダー（md未満） ────────────────────── */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#1c1410]/10 bg-[#fffdf5]/90 px-4 backdrop-blur-md md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <LogoImage size={28} style={{ boxShadow: "0 1px 4px rgba(28,20,16,0.08)" }} />
          <span className="text-sm font-extrabold text-[#1c1410]">家計かんり</span>
        </Link>
        <Link href="/expenses/new" className="btn-candy text-xs px-3 py-1.5">
          <PenLine size={13} />
          記録する
        </Link>
      </header>
    </>
  );
}
