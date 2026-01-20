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
