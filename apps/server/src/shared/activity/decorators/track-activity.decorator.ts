import { SetMetadata } from '@nestjs/common';
import { ActivityType } from '../activity-type.enum';

export const TRACK_ACTIVITY_KEY = 'track_activity';

/**
 * 특정 기능을 성공적으로 수행했을 때 사용자 활동 로그를 기록합니다.
 */
export const TrackActivity = (activityType: ActivityType) =>
  SetMetadata(TRACK_ACTIVITY_KEY, activityType);
