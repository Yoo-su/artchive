import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ReactNode } from "react";

import { getQueryClient } from "@/shared/libs/query-client";

type QueryConfig = {
  queryKey: readonly unknown[];
  queryFn: (context?: any) => Promise<any>;
  type?: "query" | "infinite";
  initialPageParam?: any;
};

type ServerQueryBoundaryProps = {
  queries?: QueryConfig[];
  queryClient?: ReturnType<typeof getQueryClient>;
  children: ReactNode;
};

export async function ServerQueryBoundary({
  queries = [],
  queryClient: externalQueryClient,
  children,
}: ServerQueryBoundaryProps) {
  const queryClient = externalQueryClient || getQueryClient();

  try {
    // 개별 프리패치 요청이 실패하더라도 다른 쿼리 프리패칭을 중단하지 않도록
    // Promise.allSettled를 사용하여 병렬로 처리합니다.
    if (queries.length > 0) {
      await Promise.allSettled(
        queries.map((q) => {
          if (q.type === "infinite") {
            return queryClient.prefetchInfiniteQuery({
              queryKey: q.queryKey,
              queryFn: q.queryFn,
              initialPageParam: q.initialPageParam,
            });
          }
          return queryClient.prefetchQuery({
            queryKey: q.queryKey,
            queryFn: q.queryFn,
          });
        }),
      );
    }
  } catch (error) {
    console.error("데이터 프리패칭 중 오류 발생:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
