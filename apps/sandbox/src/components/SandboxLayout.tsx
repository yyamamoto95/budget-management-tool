/**
 * SandboxLayout — サンドボックス共通レイアウト
 *
 * 以下を一元管理する:
 * - PC 左サイドバー（ロゴ + ナビ + ベル + アバター）
 * - SP モバイルトップバー（ベル + アバター）
 * - SP ボトムナビ（standard: 4項目グリッド / fab: 中央FABあり）
 */

import { Link } from 'react-router-dom'
import { Home, Receipt, BarChart2, Settings, Bell, Plus } from 'lucide-react'
import { D } from './SandboxCard'
import type { ReactNode } from 'react'

// ── ナビゲーション定義 ─────────────────────────────────────────────────────
export type SandboxPage = 'home' | 'meisai' | 'report' | 'settings'

const NAV_ITEMS = [
  { label: 'ホーム',   icon: Home,     to: '/home',              page: 'home'     },
  { label: '明細',     icon: Receipt,  to: '/records',           page: 'meisai'   },
  { label: 'レポート', icon: BarChart2, to: '/report',            page: 'report'   },
  { label: '設定',     icon: Settings, to: '/personal-settings', page: 'settings' },
] as const satisfies { label: string; icon: React.ElementType; to: string; page: SandboxPage }[]

// ── コンポーネント ─────────────────────────────────────────────────────────
export function SandboxLayout({
  children,
  currentPage,
  bottomNavVariant = 'standard',
  onFabClick,
}: {
  children: ReactNode
  currentPage: SandboxPage
  /** standard: 4項目グリッド / fab: 中央FABあり */
  bottomNavVariant?: 'standard' | 'fab'
  /** fab variant のみ: FABタップ時のコールバック（未指定時は /home へ遷移） */
  onFabClick?: () => void
}) {
  return (
    <>
      {/* ── PC サイドバー ─────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30 w-52 border-r"
        style={{ background: D.card, borderColor: D.border }}
      >
        {/* ロゴ */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4" style={{ borderColor: D.border }}>
          <img src="/logo192.png" alt="家計かんり" className="h-8 w-8 shrink-0" style={{ borderRadius: '10px' }} />
          <span className="text-[15px] font-extrabold tracking-tight" style={{ color: D.text }}>家計かんり</span>
        </div>

        {/* ナビ */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="メインメニュー">
          {NAV_ITEMS.map((item) => {
            const active = item.page === currentPage
            return (
              <Link key={item.label} to={item.to}
                aria-current={active ? 'page' : undefined}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-[13px] font-semibold"
                style={{
                  borderRadius:   '10px',
                  background:     active ? D.brandLight : 'transparent',
                  color:          active ? D.brand : 'rgba(28,20,16,0.50)',
                  textDecoration: 'none',
                }}
              >
                <item.icon size={17} aria-hidden />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* ベル + アバター */}
        <div className="shrink-0 border-t px-3 py-2.5 flex items-center justify-between" style={{ borderColor: D.border }}>
          <button type="button" className="flex h-8 w-8 items-center justify-center"
            style={{ color: 'rgba(28,20,16,0.45)', borderRadius: '8px' }} aria-label="通知">
            <Bell size={17} />
          </button>
          <Link to="/my-page"
            className="flex h-8 w-8 items-center justify-center text-[12px] font-extrabold text-white"
            style={{
              background:     `linear-gradient(135deg, ${D.brand}, ${D.brandDeep})`,
              borderRadius:   '9999px',
              boxShadow:      '0 2px 8px rgba(241,136,64,0.30)',
              textDecoration: 'none',
            }}
            aria-label="マイページ"
          >Y</Link>
        </div>
      </aside>

      {/* ── コンテンツエリア ───────────────────────────────────────────────── */}
      <div className="min-h-screen pb-24 lg:pb-8 lg:pl-52" style={{ background: D.bg }}>

        {/* SP: ベル + アバター */}
        <div className="lg:hidden flex items-center justify-end gap-2 px-4 pt-3 pb-1">
          <button type="button" className="flex h-8 w-8 items-center justify-center"
            style={{ color: 'rgba(28,20,16,0.45)', borderRadius: '8px' }} aria-label="通知">
            <Bell size={17} />
          </button>
          <Link to="/my-page"
            className="flex h-8 w-8 items-center justify-center text-[12px] font-extrabold text-white"
            style={{
              background:     `linear-gradient(135deg, ${D.brand}, ${D.brandDeep})`,
              borderRadius:   '9999px',
              boxShadow:      '0 2px 8px rgba(241,136,64,0.30)',
              textDecoration: 'none',
            }}
            aria-label="マイページ"
          >Y</Link>
        </div>

        {/* ページ固有コンテンツ */}
        {children}

        {/* ── SP ボトムナビ ──────────────────────────────────────────────── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
          style={{
            background:    'rgba(255,253,245,0.92)',
            backdropFilter: 'blur(16px)',
            borderTop:     `1px solid ${D.border}`,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          aria-label="メインメニュー"
        >
          {bottomNavVariant === 'fab' ? (
            /* FAB variant */
            <div className="flex items-center h-14">
              {[NAV_ITEMS[0], NAV_ITEMS[1]].map((item) => {
                const active = item.page === currentPage
                return (
                  <Link key={item.label} to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className="flex flex-1 flex-col items-center justify-center gap-0.5 h-full"
                    style={{ color: active ? D.brand : 'rgba(28,20,16,0.40)', textDecoration: 'none' }}
                  >
                    <item.icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
                    <span className="text-[10px] font-bold leading-none">{item.label}</span>
                  </Link>
                )
              })}

              {/* 中央 FAB */}
              <div className="flex flex-1 items-end justify-center pb-3">
                {onFabClick ? (
                  <button type="button" onClick={onFabClick} aria-label="記録する"
                    className="flex items-center justify-center rounded-full text-white"
                    style={{
                      width: 56, height: 56,
                      background: `linear-gradient(135deg, ${D.brand} 0%, ${D.brandDeep} 100%)`,
                      boxShadow: '0 4px 20px rgba(241,136,64,0.45), 0 1px 4px rgba(241,136,64,0.20)',
                    }}
                  >
                    <Plus size={24} />
                  </button>
                ) : (
                  <Link to="/home" aria-label="記録する"
                    className="flex items-center justify-center rounded-full text-white"
                    style={{
                      width: 56, height: 56,
                      background: `linear-gradient(135deg, ${D.brand} 0%, ${D.brandDeep} 100%)`,
                      boxShadow: '0 4px 20px rgba(241,136,64,0.45), 0 1px 4px rgba(241,136,64,0.20)',
                      textDecoration: 'none',
                    }}
                  >
                    <Plus size={24} />
                  </Link>
                )}
              </div>

              {[NAV_ITEMS[2], NAV_ITEMS[3]].map((item) => {
                const active = item.page === currentPage
                return (
                  <Link key={item.label} to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className="flex flex-1 flex-col items-center justify-center gap-0.5 h-full"
                    style={{ color: active ? D.brand : 'rgba(28,20,16,0.40)', textDecoration: 'none' }}
                  >
                    <item.icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
                    <span className="text-[10px] font-bold leading-none">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            /* standard variant */
            <div className="grid grid-cols-4 h-14">
              {NAV_ITEMS.map((item) => {
                const active = item.page === currentPage
                return (
                  <Link key={item.label} to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className="flex flex-col items-center justify-center gap-0.5"
                    style={{ color: active ? D.brand : 'rgba(28,20,16,0.40)', textDecoration: 'none' }}
                  >
                    <item.icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
                    <span className="text-[10px] font-bold leading-none">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>
      </div>
    </>
  )
}
