"use client";

import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const PurchasesSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border border-border/80 p-4 sm:p-5 shadow-xs">
          <CardContent className="p-0 flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-24 w-18 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
              <div className="pt-2 flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
