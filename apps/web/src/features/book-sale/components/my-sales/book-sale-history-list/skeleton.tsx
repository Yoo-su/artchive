"use client";

import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSaleHistoryListSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card
          key={i}
          className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-2xs bg-white dark:bg-stone-900/80"
        >
          <CardContent className="p-0 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-stone-800">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
            <div className="flex gap-3.5 items-start">
              <Skeleton className="h-22 w-16 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-3.5 w-1/2 rounded-md" />
                <Skeleton className="h-3.5 w-2/3 rounded-md" />
              </div>
            </div>
            <div className="pt-2 flex justify-between items-center border-t border-stone-100 dark:border-stone-800">
              <Skeleton className="h-5 w-24 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
