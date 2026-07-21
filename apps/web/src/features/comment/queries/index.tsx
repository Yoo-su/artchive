import { CommentTargetType } from "@bookjeok/core";
import { useCommentsQuery as useBaseCommentsQuery, useMyCommentsInfiniteQuery as useBaseMyCommentsInfiniteQuery } from "@bookjeok/react-query";

export type { Comment, CommentTargetType } from "@bookjeok/core";

export const useCommentsQuery = (
  targetType: CommentTargetType,
  targetId: string,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) => {
  return useBaseCommentsQuery(targetType, targetId, page, limit, enabled);
};

export const useMyCommentsInfiniteQuery = (limit: number = 10) =>
  useBaseMyCommentsInfiniteQuery(limit);
