import { Skeleton } from "@/components/ui/skeleton";

/** 設定ページのローディング状態 */
export default function SettingsLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <div className="flex items-center gap-3 px-4 py-3 md:hidden">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-4">
        {/* タイトル */}
        <Skeleton className="h-7 w-20" />

        {/* 給料日 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-md" />
            ))}
          </div>
        </div>

        {/* 固定費セクション */}
        <Skeleton className="h-5 w-24" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>

        {/* 貯蓄セクション */}
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-12 rounded-xl" />

        {/* 保存ボタン */}
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </div>
  );
}
