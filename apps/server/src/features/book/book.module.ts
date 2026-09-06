import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReadingLogModule } from '@/features/reading-log/reading-log.module';
import { WishlistModule } from '@/features/wishlist/wishlist.module';

import { BookController } from './controllers/book.controller';
import { Book } from './entities/book.entity';
import { BookViewCountInterceptor } from './interceptors/book-view-count.interceptor';
import { BookResolvePipe } from './pipes/book-resolve.pipe';
import { AladinBookCatalogProvider } from './providers/aladin-book-catalog.provider';
import { BOOK_CATALOG_PROVIDERS } from './providers/book-catalog.types';
import { LocalDbBookCatalogProvider } from './providers/local-db-book-catalog.provider';
import { AladinBookSearchService } from './services/aladin-book-search.service';
import { BookService } from './services/book.service';
import { BookCatalogService } from './services/book-catalog.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Book]),
    HttpModule,
    ReadingLogModule,
    WishlistModule,
  ],
  controllers: [BookController],
  providers: [
    BookService,
    BookCatalogService,
    AladinBookSearchService,
    AladinBookCatalogProvider,
    LocalDbBookCatalogProvider,
    {
      /**
       * 도서 공급처 체인. **배열 순서가 곧 조회 우선순위입니다.**
       *
       * 공급처를 갈아끼울 때 손대는 곳은 여기 하나입니다. 국립중앙도서관
       * 어댑터가 준비되면 알라딘 앞에 넣고, 2026-10-30 이후 알라딘을 뺍니다.
       *
       * 자체 DB는 지금 마지막입니다. 앞선 공급처가 죽어도 우리가 가진 도서는
       * 찾을 수 있게 하는 방어선이지, 1차 검색은 아직 아닙니다.
       * (승격은 Phase 3 — `title`/`author` 인덱스가 먼저 필요합니다.)
       */
      provide: BOOK_CATALOG_PROVIDERS,
      useFactory: (
        aladin: AladinBookCatalogProvider,
        localDb: LocalDbBookCatalogProvider,
      ) => [aladin, localDb],
      inject: [AladinBookCatalogProvider, LocalDbBookCatalogProvider],
    },
    BookViewCountInterceptor,
    BookResolvePipe,
  ],
  exports: [BookService, BookCatalogService, TypeOrmModule, BookResolvePipe], // 다른 모듈에서 Book 엔티티와 서비스 사용 가능
})
export class BookModule {}
