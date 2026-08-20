import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 중고책 판매 카드 스켈레톤
export const BookSaleSkeleton = () => {
  return (
    <div className="h-full w-full bg-white border border-neutral-200 overflow-hidden flex flex-col justify-between">
      {/* 상단 이미지 스켈레톤 */}
      <div className="relative aspect-4/3 w-full bg-neutral-100 animate-pulse border-b border-neutral-100" />

      {/* 하단 콘텐츠 스켈레톤 */}
      <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-4/5 bg-neutral-200" />
          <Skeleton className="h-3 w-1/2 bg-neutral-100" />
        </div>
        <Skeleton className="h-5 w-1/3 bg-neutral-200" />
        <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full bg-neutral-200" />
            <Skeleton className="h-3 w-14 bg-neutral-100" />
          </div>
          <Skeleton className="h-3 w-10 bg-neutral-100" />
        </div>
      </div>
    </div>
  );
};

