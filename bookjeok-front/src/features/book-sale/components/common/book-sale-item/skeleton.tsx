import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSaleSkeleton = () => {
  return (
    <Card className="h-full w-full overflow-hidden">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image Skeleton */}
        <div className="relative aspect-4/3 w-full overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Content Skeleton */}
        <div className="p-3 flex flex-col flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-7 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />

          <div className="mt-auto flex items-center justify-between pt-3 border-t border-dashed border-gray-100">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
