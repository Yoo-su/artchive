import { bookKeys } from "@bookjeok/react-query/book/keys";
import { QueryClient } from "@tanstack/react-query";

import { internalAxios } from "@/shared/libs/axios";

import { getBookList } from "../apis";

/**
 * 연관 도서 프리패칭 (서버 사이드)
 * 주로 저자명 등을 검색어로 하여 프리패칭합니다.
 */
export const prefetchRelatedBooks = async (
  queryClient: QueryClient,
  query: string,
) => {
  if (!query) return;

  return queryClient.prefetchQuery({
    queryKey: bookKeys.list({ query, display: 20, sort: "sim" }).queryKey,
    queryFn: () => getBookList(internalAxios, { query, display: 20, sort: "sim" }),
  });
};
