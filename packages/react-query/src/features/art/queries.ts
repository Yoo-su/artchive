"use client";

import { getArtDetail, getArtList, getExternalArtDetail, getExternalArtList } from "@bookjeok/api-client";
import { ArtItem, artKeys, Genre, GetArtListParams } from "@bookjeok/core";
import { useQueries, useQuery } from "@tanstack/react-query";

/**
 * 공연/예술 목록 조회
 */
export const useArtListQuery = (
  params: GetArtListParams,
) => {
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
    // ISR(24시간) 캐시 HTML 교정용
    // - 전역 기본값(staleTime: Infinity, refetchOnMount: false)이면 공연 정보가 영구 미갱신
    staleTime: 60 * 1000,
    refetchOnMount: true,
  });
};

/**
 * 외부 공공 API를 통한 공연/예술 목록 조회 (Expo 등)
 */
export const useExternalArtListQuery = (
  params: GetArtListParams,
) => {
  return useQuery({
    queryKey: [...artKeys.list(params).queryKey, "external"],
    queryFn: async () => {
      const result = await getExternalArtList(params);
      return Array.isArray(result) ? result : ([] as ArtItem[]);
    },
  });
};

/**
 * 외부 공공 API를 통한 공연/예술 상세 조회 (Expo 등)
 */
export const useExternalArtDetailQuery = (artId: string) => {
  return useQuery({
    queryKey: [...artKeys.detail(artId).queryKey, "external"],
    queryFn: async () => {
      const result = await getExternalArtDetail(artId);
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
