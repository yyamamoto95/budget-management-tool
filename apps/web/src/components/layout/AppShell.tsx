import { getCategories } from "@/lib/api/category";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

type Props = {
  userName?: string;
  children: React.ReactNode;
};

/**
 * 認証済みページ共通ラッパー
 * - PC（md以上）: 左サイドバー + コンテンツ
 * - モバイル（md未満）: ミニヘッダー + コンテンツ + ボトムナビ
 */
export async function AppShell({ userName, children }: Props) {
  const [expenseCategories, incomeCategories] = await Promise.all([
    getCategories(0).catch(() => []),
    getCategories(1).catch(() => []),
  ]);

  return (
    <div className="flex flex-col min-h-dvh md:flex-row bg-[#fffdf5]">
      {/* PC: サイドバー / モバイル: ミニヘッダー */}
      <Header userName={userName} />

      {/* コンテンツ本体 */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* モバイルのボトムナビ分の余白 */}
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
        <BottomNav userId={userName} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />
      </div>
    </div>
  );
}
