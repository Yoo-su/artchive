import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';

import { CreateTradeReviewDto } from '../dtos/create-trade-review.dto';
import { QueryTradeReviewDto } from '../dtos/query-trade-review.dto';
import { UpdateTradeReviewDto } from '../dtos/update-trade-review.dto';
import { TradeReview } from '../entities/trade-review.entity';
import {
  SellerTradeStats,
  TradeReviewService,
} from '../services/trade-review.service';

/**
 * 거래 후기.
 *
 * `PaymentFeatureGuard`를 걸지 않습니다. 후기는 거래 완료 기록에 붙고
 * 완료는 결제 없이도 생기므로, 결제 봉인과 함께 잠글 이유가 없습니다.
 * (예전에는 컨트롤러 전체가 가드에 묶여 조회 API까지 503이었습니다.)
 */
@ApiTags('거래 후기 (Trade Review)')
@Controller('trade-reviews')
export class TradeReviewController {
  constructor(private readonly tradeReviewService: TradeReviewService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '거래 후기 작성',
    description:
      '완료된 거래에 대해 상대방에게 태그 및 텍스트 후기를 작성합니다. ' +
      '거래 당사자 양쪽 모두 각 한 건씩, 거래 완료 후 14일 이내에 작성할 수 있습니다.',
  })
  @ApiResponse({
    status: 201,
    description: '후기가 성공적으로 작성되었습니다.',
  })
  async createReview(
    @Body() dto: CreateTradeReviewDto,
    @CurrentUser() user: User,
  ): Promise<TradeReview> {
    return await this.tradeReviewService.createReview(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '거래 후기 수정',
    description:
      '작성한 거래 후기의 태그 및 내용을 수정합니다. (작성 후 14일 이내)',
  })
  @ApiParam({ name: 'id', description: '후기 ID' })
  @ApiResponse({
    status: 200,
    description: '후기가 성공적으로 수정되었습니다.',
  })
  async updateReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeReviewDto,
    @CurrentUser() user: User,
  ): Promise<TradeReview> {
    return await this.tradeReviewService.updateReview(id, user.id, dto);
  }

  @Get('eligibility/:completionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '내 후기 작성 가능 여부',
    description:
      '이 거래에 대해 내가 후기를 쓸 수 있는지, 이미 썼다면 그 후기를 반환합니다.',
  })
  @ApiParam({ name: 'completionId', description: '거래 완료 기록 ID' })
  async getMyEligibility(
    @Param('completionId', ParseIntPipe) completionId: number,
    @CurrentUser() user: User,
  ) {
    return await this.tradeReviewService.getMyReviewEligibility(
      completionId,
      user.id,
    );
  }

  @Get('user/:handle')
  @ApiOperation({
    summary: '사용자가 받은 거래 후기 목록 조회',
    description:
      '특정 사용자가 거래 상대에게 받은 후기 목록을 페이지네이션으로 조회합니다.',
  })
  @ApiParam({ name: 'handle', description: '사용자 핸들(@handle) 또는 ID' })
  async getReviewsByUser(
    @Param('handle') handle: string,
    @Query() query: QueryTradeReviewDto,
  ): Promise<{
    reviews: TradeReview[];
    total: number;
    page: number;
    limit: number;
  }> {
    return await this.tradeReviewService.getReviewsByTargetUser(handle, query);
  }

  @Get('user/:handle/stats')
  @ApiOperation({
    summary: '거래 통계 및 신뢰 지표 조회',
    description:
      '거래완료 건수(직거래/택배 구분), 후기 수, 긍정 후기 비율, 태그별 집계를 조회합니다.',
  })
  @ApiParam({ name: 'handle', description: '사용자 핸들(@handle) 또는 ID' })
  async getSellerStats(
    @Param('handle') handle: string,
  ): Promise<SellerTradeStats> {
    return await this.tradeReviewService.getSellerStats(handle);
  }
}
