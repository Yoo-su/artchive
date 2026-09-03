import { CACHE_TIME } from "@bookjeok/core";
import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // ISR HTML에 구워진 스냅샷은 최대 revalidate만큼 과거
        staleTime: CACHE_TIME.ONE_MINUTE,
        // 마운트 시 교정하지 않으면 그 시점에 세션 내내 고착
        refetchOnMount: true,
        gcTime: CACHE_TIME.THIRTY_MINUTES,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        // dehydration 시 pending 상태인 쿼리도 포함합니다.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    // 서버: 항상 새로운 query client를 생성합니다.
    return makeQueryClient();
  } else {
    // 브라우저: query client가 없으면 새로 생성하고, 있으면 재사용합니다.
    // 이는 초기 렌더링 시 React가 suspend 될 때 새로운 클라이언트를 다시 생성하지 않도록 하기 위함입니다.
    // suspense boundary가 query client 생성 아래에 있다면 필요 없을 수도 있습니다.
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
