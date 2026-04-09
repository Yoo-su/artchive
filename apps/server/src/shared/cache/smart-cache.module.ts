import { Global, Module } from '@nestjs/common';

import { CacheInvalidationInterceptor } from './interceptors/cache-invalidation.interceptor';
import { SmartCacheInterceptor } from './interceptors/smart-cache.interceptor';
import { SmartCacheStore } from './smart-cache.store';

@Global()
@Module({
  providers: [
    SmartCacheStore,
    SmartCacheInterceptor,
    CacheInvalidationInterceptor,
  ],
  exports: [
    SmartCacheStore,
    SmartCacheInterceptor,
    CacheInvalidationInterceptor,
  ],
})
export class SmartCacheModule {}
