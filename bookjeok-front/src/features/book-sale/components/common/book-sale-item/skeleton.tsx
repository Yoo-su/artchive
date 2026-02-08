import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSaleSkeleton = () => {
  return (
    <Card className="h-full w-full overflow-hidden border border-stone-200 bg-white">
      {/* 이미지 영역 스켈레톤 */}
      <div className="aspect-4/5 w-full bg-stone-100" />

      {/* 컨텐츠 스켈레톤 */}
      <CardContent className="p-4">
        {/* 제목 */}
        <Skeleton className="h-5 w-3/4 rounded-sm bg-stone-100 mb-2" />

        {/* 가격 */}
        <Skeleton className="h-4 w-1/3 rounded-sm bg-stone-100 mb-3" />

        {/* 위치 */}
        <div className="flex items-center gap-1 mb-4">
          <Skeleton className="h-3 w-3 rounded-full bg-stone-100" />
          <Skeleton className="h-3 w-20 rounded-sm bg-stone-100" />
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-auto">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full bg-stone-100" />
            <Skeleton className="h-3 w-12 rounded-sm bg-stone-100" />
          </div>
          <Skeleton className="h-3 w-8 rounded-sm bg-stone-100" />
        </div>
      </CardContent>
    </Card>
  );
};
