"use client";

import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const TradeHistorySkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card
          key={i}
          className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs"
        >
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
              <Skeleton className="h-4 w-24 rounded-md" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
            <div className="flex gap-3.5">
              <Skeleton className="h-22 w-16 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
            <div className="pt-2 flex justify-between items-center border-t border-stone-100 dark:border-stone-800">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
