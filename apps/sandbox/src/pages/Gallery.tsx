import { Link } from 'react-router-dom'
import { ArrowRight, Palette, LayoutDashboard, PieChart, TrendingUp, Settings, CircleUser, Monitor, Wand2, Rows3, BarChart2, Receipt, Layers, PiggyBank, SunMedium, Shapes } from 'lucide-react'

type PrototypeCard = {
  path: string
  title: string
  description: string
  icon: React.ElementType
  issue: string
  status: 'ready' | 'wip'
}

const prototypes: PrototypeCard[] = [
  {
    path: '/daily-budget-card-palette',
    title: 'カラーパレット比較（DailyBudgetCard）',
    description: 'SAFE/CAUTION/DANGER の3ステートを3パレットパターンで横並び比較。現行との対比も掲載。',
    icon: Palette,
    issue: '#133',
    status: 'wip',
  },
  {
    path: '/home',
    title: 'ホーム画面',
    description: 'タップ展開DailyBudget・明示的モバイル順序・貯蓄ランウェイ・通知パネル・連続記録UX・PC モーダル/SP ドロワー記録。',
    icon: LayoutDashboard,
    issue: 'sandbox',
    status: 'wip',
  },
  {
    path: '/category-ab',
    title: '支出カテゴリ TOP — A/B 比較',
    description: '棒グラフ / ランキングリスト / ドーナツ+TOP3 の3パターン。メリット・デメリット付き。',
    icon: PieChart,
    issue: 'sandbox',
    status: 'wip',
  },
  {
    path: '/asset-outlook-ab',
    title: '長期指標 — A/B/C スワイプ比較（SP）',
    description: '資産ランウェイ / 今月の貯蓄額 / 年間ペース の3パターン。今日のサマリー統合、スワイプUI。',
    icon: TrendingUp,
    issue: 'sandbox',
    status: 'wip',
  },
  {
    path: '/asset-outlook-pc-ab',
    title: '長期指標 — PC レイアウト比較',
    description: '全パターン同時表示 / タブ切替 / 表示非表示トグル の3レイアウト比較。',
    icon: Monitor,
    issue: 'sandbox',
    status: 'wip',
  },
  {
    path: '/personal-settings',
    title: '個人設定 — 現行',
    description: '2カラムレイアウト。左:フォーム / 右:プレビューカード sticky。貯蓄目標・収入配分バー付き。',
    icon: Settings,
    issue: '#283',
    status: 'ready',
  },
  {
    path: '/settings-wizard',
    title: '個人設定 B — ウィザード',
    description: '給与→固定費→残高→貯蓄→確認の5ステップ。スライドアニメーション。',
    icon: Wand2,
    issue: '#283',
    status: 'wip',
  },
  {
    path: '/settings-e',
    title: '個人設定 E — コンパクトリスト',
    description: '全設定を1リストに集約。+/−ステッパーで素早く調整。スクロール不要な高密度レイアウト。',
    icon: Rows3,
    issue: '#283',
    status: 'wip',
  },
  {
    path: '/meisai',
    title: '明細',
    description: '全記録の閲覧・検索。リスト表示 ⇄ カレンダー表示。期間フィルタ（全期間/今月/先月/直近7日）。',
    icon: Receipt,
    issue: 'sandbox',
    status: 'wip',
  },
  {
    path: '/report',
    title: 'レポート',
    description: '収支サマリー + カテゴリ別分析のみ。記録一覧は明細ページへ。',
    icon: BarChart2,
    issue: 'sandbox',
    status: 'wip',
  },
  {
    path: '/status-color-palette',
    title: 'ステータスカラーパレット',
    description: '好調（緑）/ 注意（ピンク）/ 超過（赤）の3ステータスをBlock 1〜3全コンポーネントで横並び比較。閾値ロジック一覧付き。',
    icon: Layers,
    issue: 'sandbox',
    status: 'wip' as const,
  },
  {
    path: '/today-status-palette',
    title: '今日の状況 — カラーパレット比較',
    description: '好調/順調/注意/超過の4状態。バッジ・バー・インサイトのカラー設計を横並び比較。注意バーがオレンジな理由も解説。',
    icon: SunMedium,
    issue: 'sandbox',
    status: 'wip' as const,
  },
  {
    path: '/savings-forecast-palette',
    title: '今月の貯蓄予測 — カラーパレット比較',
    description: '超好調/好調/注意/危険の4状態。バー・バッジ・インサイトのカラー設計を横並び比較。',
    icon: PiggyBank,
    issue: 'sandbox',
    status: 'wip' as const,
  },
  {
    path: '/category-color-palette',
    title: 'カテゴリカラー定義',
    description: 'セマンティクトークン SSOT。支出 / 収入カテゴリの色 & アイコンを一元管理。不整合一覧・使用例プレビュー付き。',
    icon: Shapes,
    issue: 'sandbox',
    status: 'wip' as const,
  },
  {
    path: '/my-page',
    title: 'マイページ',
    description: '名前・パスワードの編集モック。インライン編集・バリデーション・保存トースト付き。',
    icon: CircleUser,
    issue: 'sandbox',
    status: 'wip',
  },
]

export function Gallery() {
  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-surface-default)' }}>
      {/* ヘッダー */}
      <div className="mb-8">
        <div
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1c1410] text-sm font-extrabold text-white mb-3"
          style={{ background: 'var(--color-brand-primary)', boxShadow: 'var(--shadow-pop-sm)' }}
        >
          S
        </div>
        <h1 className="text-2xl font-extrabold text-[#1c1410]">デザイン Sandbox</h1>
        <p className="mt-1 text-sm text-[#1c1410]/50">
          試作コンポーネントの一覧。本番実装前に自由にカスタマイズできます。
        </p>
      </div>

      {/* プロトタイプ一覧 */}
      <div className="flex flex-col gap-3 max-w-lg">
        {prototypes.map((p) => {
          const Icon = p.icon
          return (
            <Link
              key={p.path}
              to={p.path}
              className="group flex items-center gap-4 rounded-2xl border border-[#1c1410]/12 bg-white p-4 transition-colors hover:border-[#1c1410]/30"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--color-surface-default)' }}
              >
                <Icon size={20} style={{ color: 'var(--color-brand-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1c1410]">{p.title}</span>
                  <span className="rounded-full bg-[#f0fdf6] px-2 py-0.5 text-xs font-bold text-[#4caf82]">
                    {p.issue}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#1c1410]/50 truncate">{p.description}</p>
              </div>
              <ArrowRight
                size={16}
                className="shrink-0 text-[#1c1410]/30 transition-colors group-hover:text-[var(--color-brand-primary)]"
              />
            </Link>
          )
        })}
      </div>

      {/* 使い方 */}
      <div className="mt-8 rounded-xl border border-[#1c1410]/10 bg-white p-4 max-w-lg text-xs text-[#1c1410]/50">
        <p className="font-bold text-[#1c1410]/70 mb-1">新しいプロトタイプを追加するには</p>
        <ol className="list-decimal list-inside space-y-1">
          <li><code className="bg-[#fef5ee] px-1 rounded">src/pages/</code> に新しいコンポーネントを作成</li>
          <li><code className="bg-[#fef5ee] px-1 rounded">main.tsx</code> に Route を追加</li>
          <li>この Gallery の <code className="bg-[#fef5ee] px-1 rounded">prototypes</code> 配列にエントリを追加</li>
        </ol>
      </div>
    </div>
  )
}
