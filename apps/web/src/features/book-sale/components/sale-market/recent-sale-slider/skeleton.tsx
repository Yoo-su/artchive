import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 최신 중고책 슬라이더 로딩 스켈레톤
export const RecentSalesSliderSkeleton = () => {
  return (
    <div className="w-full overflow-hidden">
      {/* PC 뷰 스켈레톤 */}
      <div className="hidden md:block w-full h-[460px] lg:h-[520px] bg-[#f6f6f5] border border-neutral-200 rounded-xl sm:rounded-2xl animate-pulse relative overflow-hidden">
        <div className="absolute top-6 left-6 space-y-2">
          <Skeleton className="h-6 w-44 bg-neutral-200" />
          <Skeleton className="h-4 w-72 bg-neutral-200/60" />
        </div>
      </div>

      {/* 모바일 뷰 스켈레톤 */}
      <div className="block md:hidden">
        <div className="flex gap-3.5 overflow-hidden pb-4 pt-4 -mt-4 px-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[200px] bg-white border border-neutral-200 overflow-hidden"
            >
              <div className="aspect-4/3 w-full bg-neutral-100" />
              <div className="p-3.5 space-y-2">
                <Skeleton className="h-3.5 w-4/5 bg-neutral-200" />
                <Skeleton className="h-4 w-1/2 bg-neutral-200" />
                <div className="flex justify-between pt-2 border-t border-neutral-100">
                  <Skeleton className="h-3 w-16 bg-neutral-100" />
                  <Skeleton className="h-3 w-12 bg-neutral-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

