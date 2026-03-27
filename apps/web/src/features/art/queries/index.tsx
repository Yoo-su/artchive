import { ArtItem, Genre, GetArtListParams, PrfState } from "@bookjeok/core/art";
import { useArtDetailQuery as useBaseArtDetailQuery, useArtListQuery as useBaseArtListQuery, useMainArtsQueries as useBaseMainArtsQueries } from "@bookjeok/react-query/art";

import { internalAxios } from "@/shared/libs/axios";

/**
 * 공연/예술 목록 조회 (프록시 인스턴스 주입)
 */
export const useArtListQuery = (params: GetArtListParams) =>
  useBaseArtListQuery(params, internalAxios);

/**
 * 공연/예술 상세 조회 (프록시 인스턴스 주입)
 */
export const useArtDetailQuery = (artId: string) =>
  useBaseArtDetailQuery(artId, internalAxios);

/**
 * 메인 페이지용 공연 목록 (프록시 인스턴스 주입)
 */
export const useMainArtsQueries = (mainArts: { genreCode: Genre; title: string }[]) =>
  useBaseMainArtsQueries(mainArts, internalAxios);
