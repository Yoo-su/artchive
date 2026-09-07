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
       * 검색 체인. **배열 순서가 곧 조회 우선순위입니다.**
       *
       * 자체 DB가 마지막인 이유는 `books`에 `title`/`author` 인덱스가 없어
       * `ILIKE '%q%'`가 5만 행 풀스캔이기 때문입니다. 게다가 체인은 결과가
       * 한 건이라도 나오면 멈추므로, 자체 DB를 앞에 두면 우리가 가진 책만
       * 검색되고 신간이 결과에서 사라집니다.
       *
       * 자체 DB를 1차로 올리는 것은 인덱스 도입 이후에 다시 판단합니다.
       * 그전까지 자체 DB는 외부 공급처가 죽었을 때의 방어선입니다.
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
       * 상세 체인. **검색과 순서가 반대입니다.**
       *
       * 상세는 ISBN으로 찾는데 `books`는 ISBN이 PK라 인덱스 단건 조회입니다.
       * 검색의 풀스캔 문제가 여기에는 없습니다.
       *
       * 더구나 상세 페이지에 들어오면 `POST /book/:isbn/view`가
       * `BookResolvePipe`를 태워 그 책을 `books`에 적재합니다. 그래서 외부를
       * 먼저 부르면 **방금 우리가 저장한 책을 외부에 다시 물어보는** 꼴이고,
       * HTTP 왕복만큼 상세 페이지가 느려집니다.
       *
       * 자체 DB에 없는 책(첫 방문 ISBN)만 외부로 흘러내립니다.
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
