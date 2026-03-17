import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 리뷰 카드 스켈레톤
export function ReviewCardSkeleton() {
  return (
    <div className="flex h-[180px] bg-white overflow-hidden border border-stone-100 animate-pulse">
      {/* 이미지 (좌측) */}
      <Skeleton className="w-[120px] h-full shrink-0 bg-stone-100" />

      {/* 콘텐츠 (우측) */}
      <div className="flex-1 flex flex-col p-3 min-w-0">
        {/* 메타 정보 */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-3 w-16 bg-stone-100" />
          <Skeleton className="h-3 w-14 bg-stone-50" />
        </div>

        {/* 제목 */}
        <Skeleton className="h-4 w-full bg-stone-100 mb-1" />
        <Skeleton className="h-4 w-2/3 bg-stone-100 mb-2" />

        {/* 태그 */}
        <div className="flex gap-1.5 mb-auto">
          <Skeleton className="h-3 w-10 bg-stone-50" />
          <Skeleton className="h-3 w-12 bg-stone-50" />
        </div>

        {/* 하단 */}
        <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full bg-stone-100" />
          <Skeleton className="h-3 w-20 bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
