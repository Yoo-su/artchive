import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { BookResolvePipe } from '@/features/book/pipes/book-resolve.pipe';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { UpdateSaleStatusDto } from '@/features/user/dtos/update-sale-status.dto';
import { User } from '@/features/user/entities/user.entity';
import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';
import { IdempotencyInterceptor } from '@/shared/interceptors/idempotency.interceptor';

import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { GetBookSalesQueryDto } from '../dtos/get-book-sales-query.dto';
import { QueryBookSaleDto } from '../dtos/query-book-sale.dto';
import { UpdateBookSaleDto } from '../dtos/update-book-sale.dto';
import { UsedBookViewCountInterceptor } from '../interceptors/used-book-view-count.interceptor';
import { UsedBookSaleService } from '../services/used-book-sale.service';

// API 경로는 기존과 동일하게 유지 (/book/...)
@ApiTags('중고책 판매 (Used Book Sale)')
@Controller('book')
export class UsedBookSaleController {
  constructor(private readonly usedBookSaleService: UsedBookSaleService) {}

  @Post('sale')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(IdempotencyInterceptor)
  @TrackActivity(ActivityType.SALE_CREATE, (req) => ({ isbn: req.body.isbn }))
  @ApiOperation({
    summary: '중고책 판매글 작성',
    description: '새로운 중고책 판매글을 작성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '판매글이 성공적으로 생성되었습니다.',
  })
  async createUsedBookSale(
    @Body(BookResolvePipe) createBookSaleDto: CreateBookSaleDto,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    const newSale = await this.usedBookSaleService.createUsedBookSale(
      createBookSaleDto,
      userId,
    );
    return newSale;
  }

  @Get('sales')
  @ApiOperation({
    summary: '판매글 검색 및 목록 조회',
    description: '필터링, 검색, 정렬 조건에 따라 판매글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '판매글 목록을 반환합니다.' })
  async searchSales(@Query() query: QueryBookSaleDto) {
    return await this.usedBookSaleService.searchSales(query);
  }

  @Get('sales/regions')
  @ApiOperation({
    summary: '현재 활성화된 중고책 판매 지역(시/도, 시/군/구) 목록 조회',
    description:
      '현재 판매 중인 중고책 게시글이 존재하는 시/도 및 시/군/구 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '지역 계층 데이터 (시/도 -> 시/군/구 배열)',
  })
  async getAvailableRegions() {
    return await this.usedBookSaleService.getAvailableRegions();
  }

  @Patch('sales/:id/status')
  @UseGuards(AuthGuard('jwt'))
  @TrackActivity(ActivityType.SALE_STATUS_CHANGE, (req) => ({
    id: req.params.id,
    status: req.body.status,
  }))
  @ApiOperation({
    summary: '판매글 상태 변경',
    description: '판매글의 상태(판매중, 예약중, 판매완료)를 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상태가 성공적으로 변경되었습니다.',
  })
  @ApiParam({ name: 'id', description: '판매글 ID' })
  async updateBookSaleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() updateSaleStatusDto: UpdateSaleStatusDto,
  ) {
    const userId = user.id;
    const updatedSale = await this.usedBookSaleService.updateSaleStatus(
      id,
      userId,
      updateSaleStatusDto.status,
    );
    return updatedSale;
  }

  @Get('sales/recent')
  @ApiOperation({
    summary: '최근 판매글 조회',
    description: '최근 등록된 판매글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '최근 판매글 목록을 반환합니다.' })
  async getRecentSales() {
    return await this.usedBookSaleService.findRecentSales();
  }

  @Get('sales/popular')
  @ApiOperation({
    summary: '인기 판매글 조회',
    description: '조회수가 높은 상위 판매글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '인기 판매글 목록을 반환합니다.' })
  async getPopularSales() {
    return await this.usedBookSaleService.findPopularSales();
  }

  @Get('sales/:id/edit')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '판매글 수정용 데이터 조회',
    description:
      '본인의 판매글 데이터만 반환합니다. 본인 글이 아니면 403 Forbidden.',
  })
  @ApiResponse({ status: 200, description: '판매글 수정 데이터를 반환합니다.' })
  @ApiResponse({ status: 403, description: '수정 권한이 없습니다.' })
  @ApiResponse({ status: 404, description: '판매글을 찾을 수 없습니다.' })
  @ApiParam({ name: 'id', description: '판매글 ID' })
  async getSaleForEdit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return await this.usedBookSaleService.findSaleForEdit(id, user.id);
  }

  @Get('sales/:id')
  @ApiOperation({
    summary: '판매글 상세 조회',
    description: '특정 판매글의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '판매글 상세 정보를 반환합니다.' })
  @ApiResponse({ status: 404, description: '판매글을 찾을 수 없습니다.' })
  @ApiParam({ name: 'id', description: '판매글 ID' })
  async getSaleById(@Param('id', ParseIntPipe) id: number) {
    return await this.usedBookSaleService.findSaleById(id);
  }

  @Post('sales/:id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(UsedBookViewCountInterceptor)
  @TrackActivity(ActivityType.SALE_VIEW, (req) => ({ id: req.params.id }))
  @ApiOperation({
    summary: '판매글 조회수 기록',
    description: '판매글 상세페이지 접근 시 조회수를 기록합니다.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '조회수가 기록되었습니다.',
  })
  @ApiParam({ name: 'id', description: '판매글 ID' })
  recordSaleView(@Param('id', ParseIntPipe) _id: number): void {
    // 인터셉터에서 조회수 및 활동 로그 처리
  }

  @Get(':isbn/sales')
  @ApiOperation({
    summary: 'ISBN별 판매글 조회',
    description: '특정 책(ISBN)에 대한 판매글 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '해당 책의 판매글 목록을 반환합니다.',
  })
  @ApiParam({ name: 'isbn', description: '책 ISBN' })
  async getBookSales(
    @Param('isbn') isbn: string,
    @Query() query: GetBookSalesQueryDto,
  ) {
    return await this.usedBookSaleService.findSalesByIsbn(isbn, query);
  }

  @Patch('sales/:id')
  @UseGuards(AuthGuard('jwt'))
  @TrackActivity(ActivityType.SALE_UPDATE, (req) => ({ id: req.params.id }))
  @ApiOperation({
    summary: '판매글 수정',
    description: '판매글의 내용을 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '판매글이 성공적으로 수정되었습니다.',
  })
  @ApiParam({ name: 'id', description: '판매글 ID' })
  async updateBookSale(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() updateBookSaleDto: UpdateBookSaleDto,
  ) {
    const userId = user.id;
    const updatedSale = await this.usedBookSaleService.updateUsedBookSale(
      id,
      userId,
      updateBookSaleDto,
    );
    return {
      sale: updatedSale,
    };
  }

  @Delete('sales/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @TrackActivity(ActivityType.SALE_DELETE, (req) => ({ id: req.params.id }))
  @ApiOperation({ summary: '판매글 삭제', description: '판매글을 삭제합니다.' })
  @ApiResponse({
    status: 204,
    description: '판매글이 성공적으로 삭제되었습니다.',
  })
  @ApiParam({ name: 'id', description: '판매글 ID' })
  async deleteBookSale(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    await this.usedBookSaleService.deleteUsedBookSale(id, userId, user.role);
    return;
  }
}
