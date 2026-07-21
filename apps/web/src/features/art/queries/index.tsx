import { ArtItem, Genre, GetArtListParams, PrfState } from "@bookjeok/core";
import { useArtDetailQuery as useBaseArtDetailQuery, useArtListQuery as useBaseArtListQuery, useMainArtsQueries as useBaseMainArtsQueries } from "@bookjeok/react-query";

/**
 * 공연/예술 목록 조회
 */
export const useArtListQuery = (params: GetArtListParams) =>
  useBaseArtListQuery(params);

/**
 * 공연/예술 상세 조회
 */
export const useArtDetailQuery = (artId: string) =>
  useBaseArtDetailQuery(artId);

/**
 * 메인 페이지용 공연 목록
 */
export const useMainArtsQueries = (mainArts: { genreCode: Genre; title: string }[]) =>
  useBaseMainArtsQueries(mainArts);
