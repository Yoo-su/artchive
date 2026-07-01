import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivityLog } from './entities/activity-log.entity';
import { ActivityTrackingInterceptor } from './interceptors/activity-tracking.interceptor';
import { ActivityCleanupListener } from './listeners/activity-cleanup.listener';
import { ActivityService } from './services/activity.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])],
  providers: [ActivityService, ActivityTrackingInterceptor, ActivityCleanupListener],
  exports: [ActivityService, ActivityTrackingInterceptor],
})
export class ActivityModule {}
