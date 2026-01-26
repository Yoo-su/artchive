import { PATHS } from "@/shared/constants/paths";

import { Notification, NotificationType } from "../types";

export const getNotificationMessage = (notification: Notification): string => {
  const { type, actor, metadata } = notification;
  const actorName = actor?.nickname ?? "알 수 없는 사용자";

  switch (type) {
    case NotificationType.REVIEW_REACTION:
      return `${actorName}님이 회원님의 리뷰 "${metadata.bookTitle}"에 반응을 남겼습니다.`;
    case NotificationType.REVIEW_COMMENT:
      return `${actorName}님이 회원님의 리뷰 "${metadata.bookTitle}"에 댓글을 남겼습니다: "${metadata.commentContent}"`;
    case NotificationType.COMMENT_LIKE:
      return `${actorName}님이 회원님의 댓글에 좋아요를 눌렀습니다.`;
    default:
      return "새로운 알림이 도착했습니다.";
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
