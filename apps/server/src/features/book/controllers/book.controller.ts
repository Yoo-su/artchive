import {
  Controller,
  Post,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { BookService } from '../services/book.service';
import { BookResolvePipe } from '../pipes/book-resolve.pipe';
import { BookViewCountInterceptor } from '../interceptors/book-view-count.interceptor';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('책 (Book)')
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get('popular')
  @ApiOperation({
    summary: '인기책 조회',
    description: '조회수, 판매글, 리뷰 데이터 기반 인기책 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '인기책 목록을 반환합니다.' })
  async getPopularBooks() {
    return await this.bookService.findPopularBooks();
  }

  @Post(':isbn/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(BookViewCountInterceptor)
  @ApiOperation({
    summary: '책 상세 조회수 기록',
    description:
      '책 상세페이지 접근 시 조회수를 기록합니다. (IP 기반 24시간 중복 방지)',
  })
  @ApiResponse({ status: 204, description: '조회수가 기록되었습니다.' })
  @ApiParam({ name: 'isbn', description: '책 ISBN' })
  recordBookView(@Param('isbn', BookResolvePipe) _isbn: string): void {
    // 파이프가 도서 존재 보장, 인터셉터가 조회수 처리
  }

  @Get('search')
  @ApiOperation({
    summary: '책 검색',
    description: '책 제목 또는 저자로 책을 검색합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '검색된 책 목록을 반환합니다.',
  })
  @ApiQuery({ name: 'query', description: '검색어 (제목 또는 저자)' })
  async searchBooks(@Query('query') query: string) {
    return await this.bookService.searchBooks(query);
  }
}
