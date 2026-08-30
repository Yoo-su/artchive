import { getBookList, getSavedBookSummary } from "@bookjeok/api-client";
import { bookKeys } from "@bookjeok/core";
import { QueryClient } from "@tanstack/react-query";

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
    queryFn: () => getBookList({ query, display: 20, sort: "sim" }),
  });
};

/**
 * AI 도서 요약 정보 프리패칭 (서버 사이드)
 */
export const prefetchBookSummary = async (
  queryClient: QueryClient,
  isbn: string,
) => {
  if (!isbn) return;

  return queryClient.prefetchQuery({
    queryKey: ["bookSummary", isbn],
    queryFn: async () => {
      try {
        const result = await getSavedBookSummary(isbn);
        return result || null;
      } catch {
        return null;
      }
    },
  });
};
