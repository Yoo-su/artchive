import { getArtDetail, getArtList } from "@bookjeok/api-client/art";
import { ArtItem, Genre, GetArtListParams } from "@bookjeok/core/art";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

import { artKeys } from "./query-keys";

/**
 * 공연/예술 목록 조회
 */
export const useArtListQuery = (
  params: GetArtListParams,
  client: AxiosInstance,
) => {
  return useQuery({
    queryKey: artKeys.list(params).queryKey,
    queryFn: async () => {
      const result = await getArtList(client, params);
      return Array.isArray(result) ? result : ([] as ArtItem[]);
    },
  });
};

/**
 * 공연/예술 상세 조회
 */
export const useArtDetailQuery = (artId: string, client: AxiosInstance) => {
  return useQuery({
    queryKey: artKeys.detail(artId).queryKey,
    queryFn: async () => {
      const result = await getArtDetail(client, artId);
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
  client: AxiosInstance,
) => {
  return useQueries({
    queries: mainArts.map(({ genreCode }) => ({
      queryKey: artKeys.list({ genreCode }).queryKey,
      queryFn: async () => {
        const result = await getArtList(client, { genreCode, rows: "20" });
        return Array.isArray(result) ? result : ([] as ArtItem[]);
      },
    })),
  });
};
