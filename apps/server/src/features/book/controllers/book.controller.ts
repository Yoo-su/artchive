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
import { NaverBookSearchService } from '../services/naver-book-search.service';

@ApiTags('책 (Book)')
@Controller('book')
export class BookController {
  constructor(
    private readonly bookService: BookService,
    private readonly naverBookSearchService: NaverBookSearchService,
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

  // ===== 외부 공공 API 연동 (Expo 등 클라이언트용 프록시) =====

  @Get('external/list')
  @ApiOperation({
    summary: '외부 공공 API: 책 검색',
    description: '네이버 책 검색결과를 정제 없이 그대로 반환합니다.',
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
  @ApiResponse({
    status: 200,
    description: '검색된 책 목록을 반환합니다.',
  })
  async getExternalBookList(
    @Query('query') query: string,
    @Query('display') display?: number,
    @Query('start') start?: number,
    @Query('sort') sort?: string,
  ): Promise<Record<string, unknown>> {
    return await this.naverBookSearchService.searchRaw(
      query,
      display,
      start,
      sort,
    );
  }

  @Get('external/detail')
  @ApiOperation({
    summary: '외부 공공 API: 책 상세조회',
    description:
      '네이버 상세검색(book_adv) 결과를 정제 없이 그대로 반환합니다.',
  })
  @ApiQuery({ name: 'isbn', description: '책 ISBN' })
  @ApiResponse({
    status: 200,
    description: '책 상세정보를 반환합니다.',
  })
  async getExternalBookDetail(
    @Query('isbn') isbn: string,
  ): Promise<Record<string, unknown>> {
    return await this.naverBookSearchService.searchDetailRaw(isbn);
  }
}
