import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 중고책 판매 카드 스켈레톤
export const BookSaleSkeleton = () => {
  return (
    <div className="relative w-full overflow-hidden">
      {/* 이미지 배경 */}
      <div className="relative aspect-3/4 w-full bg-stone-100 animate-pulse">
        {/* 하단 그라디언트 */}
        <div className="absolute inset-0 bg-linear-to-t from-stone-200/80 via-stone-100/30 to-transparent" />

        {/* 하단 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
          <Skeleton className="h-4 w-3/4 bg-stone-200/50" />
          <Skeleton className="h-4 w-1/3 bg-stone-200/50" />
          <Skeleton className="h-3 w-1/4 bg-stone-200/30" />
          <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/30">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-4 rounded-full bg-stone-200/50" />
              <Skeleton className="h-3 w-12 bg-stone-200/30" />
            </div>
            <Skeleton className="h-3 w-8 bg-stone-200/30" />
          </div>
        </div>
      </div>
    </div>
  );
};
