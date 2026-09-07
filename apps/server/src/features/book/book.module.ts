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
import {
  BOOK_DETAIL_PROVIDERS,
  BOOK_SEARCH_PROVIDERS,
} from './providers/book-catalog.types';
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
       * 검색 체인. 배열 순서가 곧 조회 우선순위입니다.
       *
       * 자체 DB를 마지막에 두는 이유는 하나뿐입니다. 체인은 결과가 하나라도
       * 나오면 멈추므로, 자체 DB가 앞에 있으면 보유한 도서만 검색되고 신간이
       * 결과에서 빠집니다.
       *
       * 성능은 더 이상 이유가 아닙니다. title·author·publisher에 pg_trgm GIN
       * 인덱스를 넣어 3글자 이상 검색은 628ms에서 29ms가 됐습니다.
       *
       * 목표 형태는 [자체DB, 카카오]입니다. 다만 신간을 미리 적재하는 스케줄러가
       * 함께 배포되기 전에는 순서를 바꾸지 마세요. 자체 DB에 신간이 없는 상태로
       * 앞에 두면 신간이 검색에서 사라집니다.
       */
      provide: BOOK_SEARCH_PROVIDERS,
      useFactory: (
        aladin: AladinBookCatalogProvider,
        localDb: LocalDbBookCatalogProvider,
      ) => [aladin, localDb],
      inject: [AladinBookCatalogProvider, LocalDbBookCatalogProvider],
    },
    {
      /**
       * 상세 체인. 검색 체인과 순서가 반대입니다.
       *
       * 상세는 ISBN으로 조회하는데 books는 ISBN이 PK라 인덱스 단건 조회입니다.
       * 또한 상세 페이지 진입 시 POST /book/:isbn/view가 BookResolvePipe를 통해
       * 해당 도서를 books에 적재하므로, 외부를 먼저 호출하면 방금 저장한 도서를
       * 다시 조회하게 됩니다.
       *
       * 자체 DB에 없는 도서만 외부 공급처로 넘어갑니다.
       */
      provide: BOOK_DETAIL_PROVIDERS,
      useFactory: (
        aladin: AladinBookCatalogProvider,
        localDb: LocalDbBookCatalogProvider,
      ) => [localDb, aladin],
      inject: [AladinBookCatalogProvider, LocalDbBookCatalogProvider],
    },
    BookViewCountInterceptor,
    BookResolvePipe,
  ],
  exports: [BookService, BookCatalogService, TypeOrmModule, BookResolvePipe], // 다른 모듈에서 Book 엔티티와 서비스 사용 가능
})
export class BookModule {}
