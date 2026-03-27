import { CommentTargetType } from "@bookjeok/core/comment";
import { useCommentsQuery as useBaseCommentsQuery, useMyCommentsInfiniteQuery as useBaseMyCommentsInfiniteQuery } from "@bookjeok/react-query/comment";

import { privateAxios, publicAxios } from "@/shared/libs/axios";

export type { Comment, CommentTargetType } from "@bookjeok/core/comment";

export const useCommentsQuery = (
  targetType: CommentTargetType,
  targetId: string,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) => useBaseCommentsQuery(targetType, targetId, publicAxios, page, limit, enabled);

export const useMyCommentsInfiniteQuery = (limit: number = 10) =>
  useBaseMyCommentsInfiniteQuery(privateAxios, limit);
