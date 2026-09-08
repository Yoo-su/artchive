import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class SmartCacheStore {
  private readonly logger = new Logger(SmartCacheStore.name);

  // prefix별로 캐시 키 목록을 인메모리에 저장하여 쉽게 삭제할 수 있도록 합니다.
  private prefixKeyMap: Map<string, Set<string>> = new Map();

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async set<T>(
    prefix: string,
    key: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    await this.cacheManager.set(key, value, ttl);

    if (!this.prefixKeyMap.has(prefix)) {
      this.prefixKeyMap.set(prefix, new Set());
    }
    this.prefixKeyMap.get(prefix)!.add(key);
  }

  async get<T>(key: string): Promise<T | undefined | null> {
    return await this.cacheManager.get<T>(key);
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    const keys = this.prefixKeyMap.get(prefix);
    if (!keys || keys.size === 0) return;

    const deletionPromises = Array.from(keys).map((key) =>
      this.cacheManager.del(key).catch((error: unknown) => {
        this.logger.error(
          `캐시 키 삭제 실패 (prefix: ${prefix}, key: ${key}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }),
    );

    await Promise.all(deletionPromises);

    // 메모리 누수 방지
    this.prefixKeyMap.delete(prefix);
  }
}
