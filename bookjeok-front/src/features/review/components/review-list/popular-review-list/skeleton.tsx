import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 인기 리뷰 아이템 스켈레톤
function PopularReviewItemSkeleton() {
  return (
    <div className="h-full bg-white border border-stone-100 p-5">
      {/* 카테고리 */}
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-14 bg-stone-100" />
        <Skeleton className="h-3 w-8 bg-stone-50" />
      </div>

      {/* 제목 */}
      <Skeleton className="h-6 w-4/5 bg-stone-100 mb-1.5" />
      <Skeleton className="h-6 w-3/5 bg-stone-100 mb-2" />

      {/* 책 정보 */}
      <Skeleton className="h-3 w-2/3 bg-stone-50 mb-3" />

      {/* 본문 (PC만) */}
      <div className="hidden md:block space-y-2 mb-4">
        <Skeleton className="h-4 w-full bg-stone-50" />
        <Skeleton className="h-4 w-2/3 bg-stone-50" />
      </div>

      {/* 하단 */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full bg-stone-100" />
          <Skeleton className="h-3 w-14 bg-stone-100" />
        </div>
        <Skeleton className="h-3 w-16 bg-stone-50" />
      </div>
    </div>
  );
}

// 인기 리뷰 리스트 스켈레톤
export function PopularReviewListSkeleton() {
  return (
    <section className="mb-12 animate-pulse">
      {/* 헤더 */}
      <div className="flex items-baseline gap-3 mb-6">
        <Skeleton className="h-6 w-28 bg-stone-100" />
        <Skeleton className="h-3 w-10 bg-stone-50" />
      </div>

      {/* Mobile */}
      <div className="flex md:hidden gap-5 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="min-w-[85%]">
            <PopularReviewItemSkeleton />
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <PopularReviewItemSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
