import { BookSearchField } from '@bookjeok/core';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';

import { BookViewCountInterceptor } from '../interceptors/book-view-count.interceptor';
import { BookResolvePipe } from '../pipes/book-resolve.pipe';
import { BookService } from '../services/book.service';
import { BookCatalogService } from '../services/book-catalog.service';

const SEARCH_FIELDS: BookSearchField[] = [
  'Keyword',
  'Title',
  'Author',
  'Publisher',
];

/** 쿼리 문자열을 검색 필드로 좁힌다. 모르는 값은 기본값으로 떨어뜨린다. */
function toBookSearchField(value?: string): BookSearchField {
  return SEARCH_FIELDS.find((f) => f === value) ?? 'Keyword';
}

@ApiTags('책 (Book)')
@Controller('book')
export class BookController {
  constructor(
    private readonly bookService: BookService,
    private readonly bookCatalogService: BookCatalogService,
  ) {}

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
  @TrackActivity(ActivityType.BOOK_VIEW, (req) => ({ isbn: req.params.isbn }))
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

  // ===== 도서 공급처 연동 (공급처 조회의 단일 진입점) =====
  // 검색은 외부 공급처 우선, 상세는 자체 DB 우선이다. 순서는 book.module.ts에서 정한다.

  @Get('external/list')
  @ApiOperation({
    summary: '외부 공급처: 책 검색',
    description:
      '등록된 도서 공급처를 순서대로 조회해 정제된 표준 DTO로 반환합니다.',
  })
  @ApiQuery({ name: 'query', description: '검색어' })
  @ApiQuery({
    name: 'display',
    description: '출력수',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'start',
    description: '시작위치',
    required: false,
    type: Number,
  })
  @ApiQuery({ name: 'sort', description: '정렬', required: false })
  @ApiQuery({ name: 'queryType', description: '검색 유형', required: false })
  @ApiResponse({
    status: 200,
    description: '검색된 책 목록을 반환합니다.',
  })
  async getExternalBookList(
    @Query('query') query: string,
    @Query('display') display?: number,
    @Query('start') start?: number,
    @Query('sort') sort?: string,
    @Query('queryType') queryType?: string,
  ) {
    return await this.bookCatalogService.search({
      query,
      display,
      start,
      sort: sort === 'date' ? 'date' : 'sim',
      field: toBookSearchField(queryType),
    });
  }

  @Get('external/detail')
  @ApiOperation({
    summary: '외부 공급처: 책 상세조회',
    description:
      '등록된 도서 공급처를 순서대로 조회해 정제된 표준 DTO로 반환합니다.',
  })
  @ApiQuery({ name: 'isbn', description: '책 ISBN' })
  @ApiResponse({
    status: 200,
    description: '책 상세정보를 반환합니다.',
  })
  async getExternalBookDetail(@Query('isbn') isbn: string) {
    const book = await this.bookCatalogService.findByIsbn(isbn);
    const items = book ? [book] : [];

    // 기존 응답 형태를 유지한다. 클라이언트가 items 배열을 기대하고 있다.
    return {
      total: items.length,
      start: 1,
      display: 10,
      lastBuildDate: new Date().toISOString(),
      items,
    };
  }

  @Get(':isbn/stats')
  @ApiOperation({
    summary: '책 통계 정보 조회',
    description:
      '특정 책을 읽은 유저 수와 위시리스트에 등록한 유저 수를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '책 통계 정보를 반환합니다.',
  })
  @ApiParam({ name: 'isbn', description: '책 ISBN' })
  async getBookStats(@Param('isbn') isbn: string) {
    return await this.bookService.getBookStats(isbn);
  }
}
