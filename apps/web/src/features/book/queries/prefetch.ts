import { getSavedBookSummary } from "@bookjeok/api-client";
import { bookKeys } from "@bookjeok/core";
import { QueryClient } from "@tanstack/react-query";

/**
 * AI 도서 요약 정보 프리패칭 (서버 사이드)
 */
export const prefetchBookSummary = async (
  queryClient: QueryClient,
  isbn: string,
) => {
  if (!isbn) return;

  return queryClient.prefetchQuery({
    queryKey: bookKeys.summary(isbn).queryKey,
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
