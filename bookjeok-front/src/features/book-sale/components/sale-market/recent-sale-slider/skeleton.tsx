import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const RecentSalesSliderSkeleton = () => {
  return (
    <div className="w-full overflow-hidden px-4">
      <div className="flex gap-8 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center shrink-0 w-40">
            {/* 실제 카드 이미지 영역과 동일한 크기 및 여백 */}
            <div className="w-40 h-40 mb-4">
              <Skeleton className="w-full h-full rounded-full" />
            </div>
            {/* 실제 카드 텍스트 영역과 동일한 크기 및 여백 */}
            <div className="w-full px-2 text-center">
              <Skeleton className="h-5 w-3/4 mx-auto" />
              <Skeleton className="h-7 w-1/2 mx-auto mt-1" />
              <Skeleton className="h-4 w-2/3 mx-auto mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
