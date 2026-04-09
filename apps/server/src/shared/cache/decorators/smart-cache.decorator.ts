import { SetMetadata } from '@nestjs/common';

export interface SmartCacheOptions {
  prefix: string;
  ttl?: number; // MS 단위 (캐시 매니저 3.x 부터는 MS 사용)
  keyStrategy?: 'ip' | 'user' | 'ip+user' | 'global';
}

export const SMART_CACHE_KEY = 'smart_cache';

/**
 * 응답 형태를 자동 캐싱합니다.
 */
export const SmartCache = (options: SmartCacheOptions) =>
  SetMetadata(SMART_CACHE_KEY, options);
