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

@ApiTags('거래 후기 (Trade Review)')
@Controller('trade-reviews')
export class TradeReviewController {
  constructor(private readonly tradeReviewService: TradeReviewService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '거래 후기 작성',
    description:
      '구매확정 완료된 주문에 대해 판매자에게 태그 및 텍스트 후기를 작성합니다. (구매확정 후 14일 이내)',
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

  @Get('user/:handle')
  @ApiOperation({
    summary: '판매자 거래 후기 목록 조회',
    description:
      '특정 사용자가 판매자로서 받은 거래 후기 목록을 페이지네이션으로 조회합니다.',
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
    summary: '판매자 거래 통계 및 신뢰 지표 조회',
    description:
      '특정 판매자의 총 거래완료 건수, 후기 수, 긍정 후기 비율, 태그별 집계 수치를 조회합니다.',
  })
  @ApiParam({ name: 'handle', description: '사용자 핸들(@handle) 또는 ID' })
  async getSellerStats(
    @Param('handle') handle: string,
  ): Promise<SellerTradeStats> {
    return await this.tradeReviewService.getSellerStats(handle);
  }
}
