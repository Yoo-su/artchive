import { getArtDetail, getArtList, getExternalArtDetail, getExternalArtList } from "@bookjeok/api-client";
import { ArtItem, artKeys, Genre, GetArtListParams } from "@bookjeok/core";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

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
 * 외부 공공 API를 통한 공연/예술 목록 조회 (Expo 등)
 */
export const useExternalArtListQuery = (
  params: GetArtListParams,
  client: AxiosInstance,
) => {
  return useQuery({
    queryKey: [...artKeys.list(params).queryKey, "external"],
    queryFn: async () => {
      const result = await getExternalArtList(client, params);
      return Array.isArray(result) ? result : ([] as ArtItem[]);
    },
  });
};

/**
 * 외부 공공 API를 통한 공연/예술 상세 조회 (Expo 등)
 */
export const useExternalArtDetailQuery = (artId: string, client: AxiosInstance) => {
  return useQuery({
    queryKey: [...artKeys.detail(artId).queryKey, "external"],
    queryFn: async () => {
      const result = await getExternalArtDetail(client, artId);
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
