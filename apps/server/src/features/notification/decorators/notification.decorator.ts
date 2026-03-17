import { SetMetadata } from '@nestjs/common';
import { NotificationType } from '../entities/notification.entity';

export const NOTIFICATION_KEY = 'notification_metadata';

/**
 * 메서드 실행 성공 시 알림을 트리거하도록 설정하는 데코레이터입니다.
 * @param type 발송할 알림의 유형
 */
export const Notify = (type: NotificationType) =>
  SetMetadata(NOTIFICATION_KEY, type);
