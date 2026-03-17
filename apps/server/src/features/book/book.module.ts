import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BookController } from './controllers/book.controller';
import { BookService } from './services/book.service';
import { NaverBookSearchService } from './services/naver-book-search.service';
import { Book } from './entities/book.entity';
import { BookViewCountInterceptor } from './interceptors/book-view-count.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), HttpModule],
  controllers: [BookController],
  providers: [BookService, NaverBookSearchService, BookViewCountInterceptor],
  exports: [BookService, NaverBookSearchService, TypeOrmModule], // 다른 모듈에서 Book 엔티티와 서비스 사용 가능
})
export class BookModule {}
