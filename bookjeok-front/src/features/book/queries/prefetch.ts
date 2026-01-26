import { QueryClient } from "@tanstack/react-query";

import { getBookListServer } from "../apis/server";
import { bookKeys } from "../constants/query-keys";

/**
 * 연관 도서 목록을 프리패치하는 헬퍼 함수
 */
export async function prefetchRelatedBooks(
  queryClient: QueryClient,
  query: string,
) {
  // RelatedBooksSection 컴포넌트에서 사용하는 파라미터와 정확히 일치해야 함
  const params = {
    query,
    display: 20,
    sort: "sim" as const,
  };

  try {
    const result = await getBookListServer(params);
    if (result.success) {
      queryClient.setQueryData(bookKeys.list(params).queryKey, result.items);
    }
  } catch (error) {
    console.error(`Failed to prefetch books for query: ${query}`, error);
  }
}
