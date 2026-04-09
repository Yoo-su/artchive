import { SetMetadata } from '@nestjs/common';

export const INVALIDATE_CACHE_KEY = 'invalidate_cache';

/**
 * 지정된 캐시 prefix에 해당하는 모든 캐시 키를 무효화합니다.
 */
export const InvalidateCache = (...prefixes: string[]) =>
  SetMetadata(INVALIDATE_CACHE_KEY, prefixes);
