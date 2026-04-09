import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
  private buffer: Partial<ActivityLog>[] = [];
  private readonly MAX_BUFFER_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 1000;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  @OnEvent('ACTIVITY_LOG.CREATED', { async: true })
  handleActivityCreatedEvent(payload: Partial<ActivityLog>) {
    this.buffer.push(payload);

    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL_MS);
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    // 타이머 정리
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const logsToSave = [...this.buffer];
    this.buffer = []; // 버퍼 초기화

    try {
      await this.activityLogRepository.insert(logsToSave);
      this.logger.debug(`Successfully flushed ${logsToSave.length} activity logs to DB.`);
    } catch (error) {
      this.logger.error('Failed to save activity logs to DB', error.stack);
      // 저장 실패 시 다시 버퍼로 돌려놓는 전략은 상황에 따라 선택 (여기서는 무시하여 메모리 누수 방지)
    }
  }
}
