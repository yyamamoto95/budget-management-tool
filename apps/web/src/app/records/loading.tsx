import { Skeleton } from "@/components/ui/skeleton";

/** 明細ページのローディング状態 */
export default function RecordsLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <div className="flex items-center gap-3 px-4 py-3 md:hidden">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-4">
        {/* 期間フィルタ */}
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
          ))}
        </div>

        {/* 検索バー */}
        <Skeleton className="h-10 rounded-xl" />

        {/* 日別グループ */}
        {[...Array(3)].map((_, g) => (
          <div key={g} className="space-y-2">
            <Skeleton className="h-5 w-32" />
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
