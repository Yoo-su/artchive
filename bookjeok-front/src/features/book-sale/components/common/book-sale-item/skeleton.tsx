import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSaleSkeleton = () => {
  return (
    <Card className="h-full w-full overflow-hidden rounded-sm! border border-stone-200 bg-white shadow-sm">
      {/* 이미지 영역 스켈레톤 */}
      <div className="aspect-4/5 w-full bg-stone-100" />
      {/* 컨텐츠 스켈레톤 */}
      <CardContent className="px-3 pt-3 pb-3 flex flex-col flex-1">
        {/* 제목 (text-lg line-clamp-1) */}
        <Skeleton className="h-6 w-3/4 rounded-sm bg-stone-100 mb-1" />

        {/* 가격 (text-base font-bold) */}
        <div className="mt-1 mb-3">
          <Skeleton className="h-5 w-1/3 rounded-sm bg-stone-100" />
        </div>

        {/* 위치 (text-xs) */}
        <div className="flex items-center gap-1 mb-4">
          <Skeleton className="h-3 w-3 rounded-full bg-stone-100" />
          <Skeleton className="h-3 w-20 rounded-sm bg-stone-100" />
        </div>

        {/* 메타 정보 (mt-auto border-t) */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-auto">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full bg-stone-100 ring-1 ring-stone-100" />
            <Skeleton className="h-3 w-12 rounded-sm bg-stone-100" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3 bg-stone-100" />
            <Skeleton className="h-3 w-6 bg-stone-100" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
