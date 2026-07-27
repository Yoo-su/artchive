import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReadingLogModule } from '@/features/reading-log/reading-log.module';
import { WishlistModule } from '@/features/wishlist/wishlist.module';

import { BookController } from './controllers/book.controller';
import { Book } from './entities/book.entity';
import { BookViewCountInterceptor } from './interceptors/book-view-count.interceptor';
import { BookResolvePipe } from './pipes/book-resolve.pipe';
import { AladinBookSearchService } from './services/aladin-book-search.service';
import { BookService } from './services/book.service';

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
    AladinBookSearchService,
    BookViewCountInterceptor,
    BookResolvePipe,
  ],
  exports: [
    BookService,
    AladinBookSearchService,
    TypeOrmModule,
    BookResolvePipe,
  ], // 다른 모듈에서 Book 엔티티와 서비스 사용 가능
})
export class BookModule {}
