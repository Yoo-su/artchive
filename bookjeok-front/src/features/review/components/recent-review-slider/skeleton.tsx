import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 최신 리뷰 슬라이더 로딩 스켈레톤
export const RecentReviewSliderSkeleton = () => {
  return (
    <div className="w-full overflow-hidden px-4">
      <div className="flex gap-5 justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[260px] h-[340px] bg-white border border-stone-100 overflow-hidden animate-pulse"
          >
            {/* 상단 책 이미지 영역 */}
            <div className="h-[130px] bg-stone-50 flex items-center justify-center">
              <Skeleton className="w-[72px] h-[104px] bg-stone-100" />
            </div>

            {/* 하단 텍스트 영역 */}
            <div className="px-4 pt-3.5 pb-4 space-y-2.5">
              <Skeleton className="h-4 w-full bg-stone-100" />
              <Skeleton className="h-4 w-3/4 bg-stone-100" />
              <Skeleton className="h-3 w-1/2 bg-stone-50" />

              {/* 태그 */}
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-3 w-10 bg-stone-50" />
                <Skeleton className="h-3 w-12 bg-stone-50" />
              </div>

              {/* 구분선 + 작성자 */}
              <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full bg-stone-100" />
                <Skeleton className="h-3 w-16 bg-stone-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
