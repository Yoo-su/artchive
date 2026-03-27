import { CommentTargetType } from "@bookjeok/core/comment";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const commentKeys = createQueryKeys("comment", {
  list: (targetType: CommentTargetType, targetId: string, page: number) => ({
    queryKey: [targetType, targetId, page],
  }),
  like: (commentId: number) => ({
    queryKey: [commentId],
  }),
  my: {
    queryKey: null,
  },
});
