import { useQueries, useQuery } from "@tanstack/react-query";

import { getArtDetail, getArtList } from "./apis";
import { artKeys } from "./constants/query-keys";
import { ArtItem, Genre, GetArtListParams } from "./types";

/**
 * 공연/예술 목록 조회
 */
export const useArtListQuery = (params: GetArtListParams) => {
  return useQuery({
    queryKey: artKeys.list(params).queryKey,
    queryFn: async () => {
      const result = await getArtList(params);

      return Array.isArray(result) ? result : ([] as ArtItem[]);
    },
  });
};

/**
 * 공연/예술 상세 조회
 */
export const useArtDetailQuery = (artId: string) => {
  return useQuery({
    queryKey: artKeys.detail(artId).queryKey,
    queryFn: async () => {
      const result = await getArtDetail(artId);
      return result || null;
    },
    enabled: !!artId,
  });
};

/**
 * 메인 페이지용 공연 목록 (여러 장르 병렬 조회)
 */
export const useMainArtsQueries = (
  mainArts: { genreCode: Genre; title: string }[],
) => {
  return useQueries({
    queries: mainArts.map(({ genreCode }) => ({
      queryKey: artKeys.list({ genreCode }).queryKey,
      queryFn: async () => {
        const result = await getArtList({ genreCode, rows: "20" });

        return Array.isArray(result) ? result : ([] as ArtItem[]);
      },
    })),
  });
};
