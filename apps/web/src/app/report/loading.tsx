import { Skeleton } from "@/components/ui/skeleton";

/** レポートページのローディング状態 */
export default function ReportLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <div className="flex items-center gap-3 px-4 py-3 md:hidden">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-4">
        {/* 期間フィルタ */}
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
          ))}
        </div>

        {/* ヒーロー支出 */}
        <Skeleton className="h-28 rounded-2xl" />

        {/* 収入・収支 */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>

        {/* カテゴリ内訳 */}
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 rounded-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
