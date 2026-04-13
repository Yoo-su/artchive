import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';

import { ActivityType } from '../activity-type.enum';

export const TRACK_ACTIVITY_KEY = 'track_activity';

/**
 * 요청 객체에서 로그에 기록할 세부 데이터를 추출하는 함수 타입
 */
export type ActivityDetailExtractor = (
  req: Request,
) => Record<string, unknown> | null;

/**
 * 활동 추적 메타데이터 인터페이스
 */
export interface TrackActivityMetadata {
  activityType: ActivityType;
  extractor?: ActivityDetailExtractor;
}

/**
 * 특정 기능을 성공적으로 수행했을 때 사용자 활동 로그를 기록합니다.
 * @param activityType 활동 타입 또는 메타데이터 객체
 * @param extractor (선택) 데이터 추출 함수
 */
export function TrackActivity(
  activityType: ActivityType,
  extractor?: ActivityDetailExtractor,
): MethodDecorator {
  const metadata: TrackActivityMetadata = {
    activityType,
    extractor,
  };
  return SetMetadata(TRACK_ACTIVITY_KEY, metadata);
}
