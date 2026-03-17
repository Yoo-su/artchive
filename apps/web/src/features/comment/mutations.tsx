"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  createComment,
  deleteComment,
  toggleCommentLike,
  updateComment,
} from "./apis";
import { commentKeys } from "./constants/query-keys";
import { Comment, CommentTargetType } from "./types";

/**
 * 댓글 생성 뮤테이션 훅
 */
export const useCreateCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
) => {
  const queryClient = useQueryClient();
  const t = useTranslations("comment.toast");

  return useMutation({
    mutationFn: (content: string) =>
      createComment({ content, targetType, targetId }),
    onSuccess: () => {
      // 첫 페이지 목록 새로고침
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(targetType, targetId, 1).queryKey,
      });
      toast.success(t("create_success"));
    },
    onError: () => {
      toast.error(t("create_error"));
    },
  });
};

/**
 * 댓글 수정 뮤테이션 훅
 */
export const useUpdateCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
  page: number,
) => {
  const queryClient = useQueryClient();
  const t = useTranslations("comment.toast");

  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      updateComment(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(targetType, targetId, page).queryKey,
      });
      toast.success(t("update_success"));
    },
    onError: () => {
      toast.error(t("update_error"));
    },
  });
};

/**
 * 댓글 삭제 뮤테이션 훅
 */
export const useDeleteCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
  page: number,
) => {
  const queryClient = useQueryClient();
  const t = useTranslations("comment.toast");

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(targetType, targetId, page).queryKey,
      });
      toast.success(t("delete_success"));
    },
    onError: () => {
      toast.error(t("delete_error"));
    },
  });
};

/**
 * 댓글 좋아요 토글 뮤테이션 훅 (낙관적 업데이트)
 */
export const useToggleCommentLikeMutation = (
  targetType: CommentTargetType,
  targetId: string,
  page: number,
) => {
  const queryClient = useQueryClient();
  const t = useTranslations("comment.toast");
  const queryKey = commentKeys.list(targetType, targetId, page).queryKey;

  return useMutation({
    mutationFn: toggleCommentLike,
    onMutate: async (commentId: number) => {
      // 진행 중인 리패치 취소
      await queryClient.cancelQueries({ queryKey });

      // 이전 값 스냅샷 저장
      const previousData = queryClient.getQueryData(queryKey);

      // 낙관적 업데이트
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
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(t("like_error"));
    },
  });
};

/**
 * 내 댓글 삭제 뮤테이션 훅 (마이페이지용)
 * 삭제 후 내 댓글 목록을 새로고침합니다.
 */
export const useDeleteMyCommentMutation = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("comment.toast");

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      // 내 댓글 목록 새로고침
      queryClient.invalidateQueries({
        queryKey: commentKeys.my.queryKey,
      });
      toast.success(t("delete_success"));
    },
    onError: () => {
      toast.error(t("delete_error"));
    },
  });
};
