import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReadingLogModule } from '@/features/reading-log/reading-log.module';
import { WishlistModule } from '@/features/wishlist/wishlist.module';

import { BookController } from './controllers/book.controller';
import { Book } from './entities/book.entity';
import { BookViewCountInterceptor } from './interceptors/book-view-count.interceptor';
import { BookResolvePipe } from './pipes/book-resolve.pipe';
import {
  BOOK_DETAIL_PROVIDERS,
  BOOK_SEARCH_PROVIDERS,
} from './providers/book-catalog.types';
import { LocalDbBookCatalogProvider } from './providers/local-db-book-catalog.provider';
import { BookService } from './services/book.service';
import { BookCatalogService } from './services/book-catalog.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Book]), ReadingLogModule, WishlistModule],
  controllers: [BookController],
  providers: [
    BookService,
    BookCatalogService,
    LocalDbBookCatalogProvider,
    {
      /**
       * 검색 체인. 자체 DB 단독입니다.
       *
       * 2026-09-08에 알라딘 어댑터를 제거했습니다. 외부 공급처를 런타임 경로에
       * 두지 않는 것이 이 서비스의 방침이고, 신규 도서는 서버가 아니라 운영자가
       * 주기적으로 돌리는 스크립트로 확보합니다.
       *
       * 검색 품질은 pg_trgm GIN 인덱스(title·author·publisher)와 어댑터의
       * 관련도 정렬이 담당합니다. 3글자 이상 검색은 29ms입니다.
       *
       * 여기에 공급처를 다시 넣을 일이 생기면 배열에 어댑터를 추가하기만 하면
       * 됩니다. 포트를 둔 이유가 그것입니다.
       */
      provide: BOOK_SEARCH_PROVIDERS,
      useFactory: (localDb: LocalDbBookCatalogProvider) => [localDb],
      inject: [LocalDbBookCatalogProvider],
    },
    {
      /**
       * 상세 체인. 자체 DB 단독입니다.
       *
       * ISBN이 PK라 인덱스 단건 조회입니다. 여기서 못 찾으면 그 도서는 우리에게
       * 없는 것이고, resolveBook()이 BOOK_NOT_FOUND를 던집니다.
       *
       * 이 변경으로 크롤러발 신규 도서 유입이 멈춥니다. 상세 페이지 진입 시
       * POST /book/:isbn/view가 BookResolvePipe를 태우는데, 외부 공급처가 없으면
       * 모르는 ISBN에 대해 더 이상 행을 만들지 않습니다.
       */
      provide: BOOK_DETAIL_PROVIDERS,
      useFactory: (localDb: LocalDbBookCatalogProvider) => [localDb],
      inject: [LocalDbBookCatalogProvider],
    },
    BookViewCountInterceptor,
    BookResolvePipe,
  ],
  exports: [BookService, BookCatalogService, TypeOrmModule, BookResolvePipe], // 다른 모듈에서 Book 엔티티와 서비스 사용 가능
})
export class BookModule {}
