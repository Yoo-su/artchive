export enum NotificationType {
  REVIEW_REACTION = "REVIEW_REACTION",
  REVIEW_COMMENT = "REVIEW_COMMENT",
  COMMENT_LIKE = "COMMENT_LIKE",
}

export interface NotificationUser {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
}

export interface NotificationMetadata {
  reviewId?: number;
  bookTitle?: string;
  reviewTitle?: string;
  commentContent?: string;
  commentId?: number;
  targetType?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: number;
  recipientId: number;
  actorId: number | null;
  actor?: NotificationUser;
  type: NotificationType;
  metadata: NotificationMetadata;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  items: Notification[];
  nextCursor: number | null;
}

export interface GetNotificationsParams {
  cursor?: number;
  limit?: number;
}
