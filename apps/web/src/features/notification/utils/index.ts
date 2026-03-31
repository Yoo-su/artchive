import { Notification, NotificationType } from "@bookjeok/core";

import { PATHS } from "@/shared/constants/paths";

export const getNotificationMessageParams = (
  notification: Notification,
): { key: string; params: Record<string, string> } => {
  const { type, actor, metadata } = notification;
  const actorName = actor?.nickname ?? "unknown_user";

  switch (type) {
    case NotificationType.REVIEW_REACTION:
      return {
        key: "review_reaction",
        params: {
          actorName,
          bookTitle: metadata.bookTitle || "",
        },
      };
    case NotificationType.REVIEW_COMMENT:
      return {
        key: "review_comment",
        params: {
          actorName,
          bookTitle: metadata.bookTitle || "",
          commentContent: metadata.commentContent || "",
        },
      };
    case NotificationType.COMMENT_LIKE:
      return {
        key: "comment_like",
        params: {
          actorName,
        },
      };
    default:
      return {
        key: "default",
        params: {},
      };
  }
};

export const getNotificationLink = (notification: Notification): string => {
  const { type, metadata } = notification;

  switch (type) {
    case NotificationType.REVIEW_REACTION:
    case NotificationType.REVIEW_COMMENT:
      return metadata.reviewId ? PATHS.REVIEW_DETAIL(metadata.reviewId) : "#";
    case NotificationType.COMMENT_LIKE:
      // 리뷰 댓글에 대한 좋아요인 경우, 리뷰 상세 페이지로 이동
      return metadata.reviewId ? PATHS.REVIEW_DETAIL(metadata.reviewId) : "#";
    default:
      return "#";
  }
};
