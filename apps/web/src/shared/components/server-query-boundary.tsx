// publicApiClient/privateApiClient의 baseURL을 설정하는 사이드이펙트 임포트
//
// 빌드 타임 프리렌더에서는 레이아웃 모듈이 페이지 프리패치보다 먼저 평가된다는 보장이 없어
// baseURL이 undefined인 채로 요청이 실패하고, 아래 allSettled가 이를 삼킨다.
// 프리패치를 수행하는 이 파일에서 직접 임포트해 렌더 방식과 무관하게 보장
import "@/shared/libs/axios";

import {
  dehydrate,
  HydrationBoundary,
  QueryFunction,
} from "@tanstack/react-query";
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
    // 개별 프리패치 실패가 다른 쿼리를 중단시키지 않도록 allSettled로 병렬 처리
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

      // 프리패치 실패는 해당 섹션이 서버 렌더링에서 비는 것을 의미하므로
      // (검색엔진에 빈 페이지로 노출) 로그로 남긴다
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
