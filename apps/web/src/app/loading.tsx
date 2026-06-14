import { Skeleton } from "@/components/ui/skeleton";

/** ルートレベルのローディング状態（ホーム画面のスケルトン） */
export default function HomeLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 py-3 md:hidden">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-4">
        {/* 予算ヒーローカード */}
        <Skeleton className="h-40 rounded-2xl" />

        {/* 今月サマリー */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>

        {/* ウィークリーストリーク */}
        <Skeleton className="h-16 rounded-xl" />

        {/* 最近の記録 */}
        <Skeleton className="h-6 w-28" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
