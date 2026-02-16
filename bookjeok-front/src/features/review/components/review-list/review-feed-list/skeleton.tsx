import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { ReviewCardSkeleton } from "../../common/review-card/skeleton";

// 리뷰 피드 리스트 스켈레톤
export function ReviewFeedListSkeleton() {
  return (
    <div className="space-y-16 animate-pulse">
      {[...Array(2)].map((_, sectionIndex) => (
        <div key={sectionIndex} className="review-feed-section">
          {/* 카테고리 헤더 */}
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="flex items-center gap-3">
              <div className="h-px w-6 bg-stone-200" />
              <Skeleton className="h-5 w-24 bg-stone-100" />
              <Skeleton className="h-3 w-12 bg-stone-50" />
            </div>
            <Skeleton className="h-3 w-10 bg-stone-50" />
          </div>

          {/* 카드 목록 */}
          <div className="flex gap-4 overflow-hidden pb-12 px-1">
            {[...Array(3)].map((_, cardIndex) => (
              <div key={cardIndex} className="w-[280px] sm:w-[320px] shrink-0">
                <ReviewCardSkeleton />
              </div>
            ))}
            <div className="w-[100px] shrink-0 opacity-50 overflow-hidden">
              <ReviewCardSkeleton />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
