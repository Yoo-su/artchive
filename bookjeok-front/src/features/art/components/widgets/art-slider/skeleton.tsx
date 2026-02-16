import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 아트 슬라이더 로딩 스켈레톤
export const ArtSliderSkeleton = () => {
  return (
    <div className="px-8 w-full overflow-hidden">
      <div className="flex flex-row gap-5 animate-pulse">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="w-[260px] shrink-0">
            {/* 포스터 영역 */}
            <Skeleton className="w-full aspect-3/4 bg-stone-100" />
            {/* 콘텐츠 영역 */}
            <div className="pt-3 space-y-2">
              <Skeleton className="h-4 w-4/5 bg-stone-100" />
              <Skeleton className="h-3 w-3/5 bg-stone-100" />
              <Skeleton className="h-3 w-2/5 bg-stone-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
