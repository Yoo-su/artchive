import { PATHS } from "@/shared/constants/paths";

import { Notification, NotificationType } from "../types";

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
      // If it's a comment on a review, go to the review
      return metadata.reviewId ? PATHS.REVIEW_DETAIL(metadata.reviewId) : "#";
    default:
      return "#";
  }
};
