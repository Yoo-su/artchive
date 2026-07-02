import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReadingLogModule } from '@/features/reading-log/reading-log.module';
import { WishlistModule } from '@/features/wishlist/wishlist.module';

import { BookController } from './controllers/book.controller';
import { Book } from './entities/book.entity';
import { BookViewCountInterceptor } from './interceptors/book-view-count.interceptor';
import { BookResolvePipe } from './pipes/book-resolve.pipe';
import { BookService } from './services/book.service';
import { NaverBookSearchService } from './services/naver-book-search.service';

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
    NaverBookSearchService,
    BookViewCountInterceptor,
    BookResolvePipe,
  ],
  exports: [
    BookService,
    NaverBookSearchService,
    TypeOrmModule,
    BookResolvePipe,
  ], // 다른 모듈에서 Book 엔티티와 서비스 사용 가능
})
export class BookModule {}
