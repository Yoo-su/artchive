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

  async createNotification(
    recipientId: number,
    actorId: number,
    type: NotificationType,
    metadata: Record<string, any>,
  ) {
    if (recipientId === actorId) return; // Self-notification prevention

    const notification = this.notificationRepository.create({
      recipient: { id: recipientId },
      actor: { id: actorId },
      type,
      metadata,
    });

    const saved = await this.notificationRepository.save(notification);

    // Fetch full entity with relations for socket payload
    const populatedNotification = await this.notificationRepository.findOne({
      where: { id: saved.id },
      relations: ['actor'],
    });

    if (populatedNotification) {
      // Real-time dispatch
      this.notificationGateway.sendNotification(
        recipientId,
        populatedNotification,
      );
    }

    return saved;
  }

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

  async getUnreadCount(userId: number) {
    return this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number) {
    await this.notificationRepository.update(
      { id, recipientId: userId },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
  }

  async remove(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      // If not found or not owned, just return (idempotent) or throw 404.
      // Usually better to return to maintain idempotency if already deleted.
      return;
    }

    await this.notificationRepository.remove(notification);
  }
}
