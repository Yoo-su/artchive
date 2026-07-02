import { CommentTargetType } from "@bookjeok/core";
import { useCommentsQuery as useBaseCommentsQuery, useMyCommentsInfiniteQuery as useBaseMyCommentsInfiniteQuery } from "@bookjeok/react-query";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { privateAxios, publicAxios } from "@/shared/libs/axios";

export type { Comment, CommentTargetType } from "@bookjeok/core";

export const useCommentsQuery = (
  targetType: CommentTargetType,
  targetId: string,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const client = accessToken ? privateAxios : publicAxios;
  return useBaseCommentsQuery(targetType, targetId, client, page, limit, enabled);
};

export const useMyCommentsInfiniteQuery = (limit: number = 10) =>
  useBaseMyCommentsInfiniteQuery(privateAxios, limit);
