"use client";
import { createComment, deleteComment, toggleCommentLike, updateComment } from "@bookjeok/api-client";
import { Comment, commentKeys, CommentTargetType, CreateCommentParams, UpdateCommentParams } from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 댓글 생성 뮤테이션 훅
 */
export const useCreateCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
  client: AxiosInstance,
  options?: { onSuccess?: (data: Comment) => void; onError?: (error: unknown) => void }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, idempotencyKey }: { content: string, idempotencyKey?: string }) =>
      createComment(client, { content, targetType, targetId }, { idempotencyKey }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(targetType, targetId, 1).queryKey,
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 댓글 수정 뮤테이션 훅
 */
export const useUpdateCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
  page: number,
  client: AxiosInstance,
  options?: { onSuccess?: (data: Comment) => void; onError?: (error: unknown) => void }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      updateComment(client, id, { content }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(targetType, targetId, page).queryKey,
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 댓글 삭제 뮤테이션 훅
 */
export const useDeleteCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
  page: number,
  client: AxiosInstance,
  options?: { onSuccess?: () => void; onError?: (error: unknown) => void }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteComment(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(targetType, targetId, page).queryKey,
      });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 댓글 좋아요 토글 뮤테이션 훅 (낙관적 업데이트)
 */
export const useToggleCommentLikeMutation = (
  targetType: CommentTargetType,
  targetId: string,
  page: number,
  client: AxiosInstance,
  options?: { onError?: (error: unknown) => void }
) => {
  const queryClient = useQueryClient();
  const queryKey = commentKeys.list(targetType, targetId, page).queryKey;

  return useMutation({
    mutationFn: (id: number) => toggleCommentLike(client, id),
    onMutate: async (commentId: number) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(
        queryKey,
        (old: { data: Comment[]; meta: unknown } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    isLiked: !comment.isLiked,
                    likeCount: comment.isLiked
                      ? comment.likeCount - 1
                      : comment.likeCount + 1,
                  }
                : comment,
            ),
          };
        },
      );

      return { previousData };
    },
    onError: (err, commentId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      options?.onError?.(err);
    },
  });
};

/**
 * 내 댓글 삭제 뮤테이션 훅 (마이페이지용)
 */
export const useDeleteMyCommentMutation = (client: AxiosInstance, options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteComment(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.my.queryKey,
      });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
