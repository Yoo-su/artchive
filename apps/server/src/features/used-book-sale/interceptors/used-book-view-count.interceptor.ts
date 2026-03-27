import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { BaseViewCountInterceptor } from '@/shared/interceptors/base-view-count.interceptor';

import { UsedBookSaleService } from '../services/used-book-sale.service';

@Injectable()
export class UsedBookViewCountInterceptor extends BaseViewCountInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    private usedBookSaleService: UsedBookSaleService,
  ) {
    super(cacheManager);
  }

  protected get cachePrefix(): string {
    return 'used_book_view_count';
  }

  protected async incrementCount(id: number | string): Promise<void> {
    await this.usedBookSaleService.incrementViewCount(Number(id));
  }
}
