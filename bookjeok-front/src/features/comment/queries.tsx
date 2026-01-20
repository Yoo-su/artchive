"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { commentKeys } from "@/shared/constants/query-keys/comment";

import { getComments, getMyComments } from "./apis";
import { COMMENTS_PER_PAGE } from "./constants";
import { CommentTargetType } from "./types";

/**
 * 댓글 목록 조회
 */
export const useCommentsQuery = (
  targetType: CommentTargetType,
  targetId: string,
  page: number = 1,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.commentKeys.list(targetType, targetId, page).queryKey,
    queryFn: () =>
      getComments({
        targetType,
        targetId,
        page,
        limit: COMMENTS_PER_PAGE,
      }),
    enabled,
  });
};

/**
 * 내 댓글 목록 (무한 스크롤, 내 데이터 - 짧은 staleTime)
 */
export const useMyCommentsInfiniteQuery = (limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: commentKeys.my.queryKey,
    queryFn: ({ pageParam }) =>
      getMyComments(1, limit, pageParam as number | undefined),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.nextCursor ?? undefined;
    },
    initialPageParam: undefined as number | undefined,
    staleTime: 60 * 1000,
  });
};
