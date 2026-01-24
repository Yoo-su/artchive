import { ReviewCardSkeleton } from "@/features/review/components/common/review-card/skeleton";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const RecommendReviewsSkeleton = () => {
  return (
    <div className="w-full py-12 border-t border-stone-100 mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-16" />
      </div>

      <div className="flex gap-4 overflow-hidden p-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[280px] sm:min-w-[320px]">
            <ReviewCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};
