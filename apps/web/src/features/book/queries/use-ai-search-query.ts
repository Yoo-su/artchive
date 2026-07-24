import { publicApiClient } from "@bookjeok/api-client";
import { useQuery } from "@tanstack/react-query";

import { API_PATHS } from "@/shared/constants/apis";

export interface AiSearchBookItem {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
  image: string;
  similarity: number;
  reason?: string;
}

export interface AiSearchResponse {
  books: AiSearchBookItem[];
  explanation: string;
}

/**
 * AI 추천 도서 검색 쿼리 훅 (Semantic Search + RAG)
 */
export const useAiSearchQuery = (query: string, enabled = true) => {
  return useQuery<AiSearchResponse>({
    queryKey: ["aiSearch", query],
    queryFn: async () => {
      const response = await publicApiClient.post<AiSearchResponse>(
        API_PATHS.search.ai,
        { query },
      );
      return response.data;
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 1000 * 60 * 10, // 10분 간 결과 캐싱
    retry: 1,
  });
};
