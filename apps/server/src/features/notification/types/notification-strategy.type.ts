import { NotificationType } from '../entities/notification.entity';

export interface NotificationPayload {
  recipientId: number;
  actorId: number;
  type: NotificationType;
  metadata: Record<string, any>;
}

export interface NotificationStrategy {
  /**
   * 작업 결과로부터 알림 페이로드를 생성합니다.
   * @param result 인터셉트된 메서드의 반환값
   * @param actorId 액션을 수행한 사용자 ID
   */
  createPayload(
    result: any,
    actorId: number,
  ): Promise<NotificationPayload | null>;
}
