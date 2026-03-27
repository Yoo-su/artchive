"use client";
import { getComments, getMyComments } from "@bookjeok/api-client/comment";
import { CACHE_TIME } from "@bookjeok/core";
import { CommentTargetType } from "@bookjeok/core/comment";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

import { commentKeys } from "./query-keys";

/**
 * 댓글 목록 조회
 */
export const useCommentsQuery = (
  targetType: CommentTargetType,
  targetId: string,
  client: AxiosInstance,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: commentKeys.list(targetType, targetId, page).queryKey,
    queryFn: () =>
      getComments(client, {
        targetType,
        targetId,
        page,
        limit,
      }),
    enabled,
  });
};

/**
 * 내 댓글 목록 (무한 스크롤)
 */
export const useMyCommentsInfiniteQuery = (client: AxiosInstance, limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: commentKeys.my.queryKey,
    queryFn: ({ pageParam }) =>
      getMyComments(client, 1, limit, pageParam as number | undefined),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.nextCursor ?? undefined;
    },
    initialPageParam: undefined as number | undefined,
    staleTime: CACHE_TIME.ONE_MINUTE,
  });
};
