import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSliderSkeleton = () => (
  <div className="relative w-full book-swiper-container overflow-hidden">
    <div className="py-24">
      <div className="flex justify-center items-center h-[450px]">
        <div className="flex items-center space-x-[-50px]">
          {[...Array(5)].map((_, i) => {
            // 중앙(index 2)이 가장 높고, 좌우로 갈수록 낮아지는 스타일
            const isCenter = i === 2;
            const isAdjacent = i === 1 || i === 3;
            const isEdge = i === 0 || i === 4;

            return (
              <Skeleton
                key={i}
                className={`h-[360px] w-[240px] md:h-[450px] md:w-[300px] rounded-lg bg-gray-200 ${
                  isCenter
                    ? "z-10 scale-105 -translate-y-[25px]"
                    : isAdjacent
                      ? "z-5 scale-95 -translate-y-[10px] opacity-80"
                      : "scale-85 opacity-50"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

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
