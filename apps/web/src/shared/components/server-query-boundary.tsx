// publicApiClient/privateApiClient의 baseURL을 설정하는 사이드이펙트 임포트.
//
// 서버 프리패치는 이 모듈이 평가되는 시점에 baseURL이 잡혀 있어야 합니다.
// 레이아웃도 같은 임포트를 갖고 있지만, 빌드 타임 프리렌더에서는 레이아웃 모듈이
// 페이지 프리패치보다 먼저 평가된다는 보장이 없어 baseURL이 undefined인 채로
// 요청이 실패하고, 아래 Promise.allSettled가 그 실패를 조용히 삼킵니다.
// 프리패치를 수행하는 이 파일에서 직접 보장해 렌더 방식과 무관하게 동작시킵니다.
import "@/shared/libs/axios";

import { dehydrate, HydrationBoundary, QueryFunction } from "@tanstack/react-query";
import { ReactNode } from "react";

import { getQueryClient } from "@/shared/libs/query-client";

type QueryConfig =
  | {
      type?: "query";
      queryKey: readonly unknown[];
      queryFn: QueryFunction<unknown, readonly unknown[], never>;
    }
  | {
      type: "infinite";
      queryKey: readonly unknown[];
      queryFn: QueryFunction<unknown, readonly unknown[], any>;
      initialPageParam?: unknown;
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
      const results = await Promise.allSettled(
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

      // 실패한 프리패치는 해당 섹션이 서버 렌더링에서 비어버린다는 뜻이므로
      // (검색엔진에는 빈 페이지로 보입니다) 조용히 넘기지 않고 남깁니다.
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `프리패치 실패 [${JSON.stringify(queries[index].queryKey)}]:`,
            result.reason,
          );
        }
      });
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
