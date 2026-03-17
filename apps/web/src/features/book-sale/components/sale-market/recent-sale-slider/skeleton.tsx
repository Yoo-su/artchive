import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 최신 중고책 슬라이더 로딩 스켈레톤
export const RecentSalesSliderSkeleton = () => {
  return (
    <div className="w-full overflow-hidden px-4">
      <div className="flex gap-6 justify-center animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[200px] h-[280px] bg-stone-200 overflow-hidden relative"
          >
            {/* 하단 텍스트 영역 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <Skeleton className="h-4 w-4/5 bg-stone-300/50" />
              <Skeleton className="h-3 w-3/5 bg-stone-300/30" />
              <Skeleton className="h-2.5 w-2/5 bg-stone-300/20" />
              <Skeleton className="h-2.5 w-1/2 bg-stone-300/20 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
