import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
import { NotificationGateway } from '../gateways/notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * 알림을 생성하고 데이터베이스에 저장합니다.
   * 저장 후 실시간 게이트웨이를 통해 수신자에게 즉시 전송합니다.
   *
   * @param recipientId 수신자 ID
   * @param actorId 행위자(알림 유발자) ID
   * @param type 알림 유형
   * @param metadata 알림 메타데이터 (JSON)
   * @returns 저장된 알림 엔티티
   */
  async createNotification(
    recipientId: number,
    actorId: number,
    type: NotificationType,
    metadata: Record<string, any>,
  ) {
    if (recipientId === actorId) return;

    const notification = this.notificationRepository.create({
      recipient: { id: recipientId },
      actor: { id: actorId },
      type,
      metadata,
    });

    const saved = await this.notificationRepository.save(notification);

    const populatedNotification = await this.notificationRepository.findOne({
      where: { id: saved.id },
      relations: ['actor'],
    });

    if (populatedNotification) {
      this.notificationGateway.sendNotification(
        recipientId,
        populatedNotification,
      );
    }

    return saved;
  }

  /**
   * 사용자의 알림 목록을 커서 기반 페이지네이션으로 조회합니다.
   *
   * @param userId 조회할 사용자 ID
   * @param cursor 이전 페이지의 마지막 알림 ID (옵션)
   * @param limit 조회할 개수 (기본값 20)
   * @returns 알림 목록 및 다음 커서
   */
  async getNotifications(userId: number, cursor?: number, limit = 20) {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actor', 'actor')
      .where('notification.recipientId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .take(limit + 1); // +1 to check if there is a next page

    if (cursor) {
      query.andWhere('notification.id < :cursor', { cursor });
    }

    const items = await query.getMany();
    let nextCursor: number | null = null;

    if (items.length > limit) {
      const nextItem = items.pop();
      if (nextItem) {
        nextCursor = nextItem.id;
      }
    }

    return {
      items,
      nextCursor,
    };
  }

  /**
   * 사용자의 읽지 않은 알림 개수를 반환합니다.
   *
   * @param userId 사용자 ID
   */
  async getUnreadCount(userId: number) {
    return this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  /**
   * 특정 알림을 읽음 상태로 변경합니다.
   *
   * @param id 알림 ID
   * @param userId 사용자 ID (권한 확인용)
   */
  async markAsRead(id: number, userId: number) {
    await this.notificationRepository.update(
      { id, recipientId: userId },
      { isRead: true },
    );
  }

  /**
   * 사용자의 모든 알림을 읽음 상태로 변경합니다.
   *
   * @param userId 사용자 ID
   */
  async markAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
  }

  /**
   * 특정 알림을 삭제합니다.
   *
   * @param id 알림 ID
   * @param userId 사용자 ID (권한 확인용)
   */
  async remove(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      return;
    }

    await this.notificationRepository.remove(notification);
  }
}
