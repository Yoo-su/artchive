import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { EmailVerifiedGuard } from '@/features/auth/guards/email-verified.guard';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';
import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';

import { CompleteTradeDto } from '../dtos/complete-trade.dto';
import { QueryMyCompletionsDto } from '../dtos/query-my-completions.dto';
import { ReserveSaleDto } from '../dtos/reserve-sale.dto';
import { TradeCompletionService } from '../services/trade-completion.service';

/**
 * 직거래의 예약·완료 처리.
 *
 * 결제(`/orders`)와 달리 `PaymentFeatureGuard`를 걸지 않습니다. 직거래는
 * PG 승인과 무관하게 동작해야 하는 기존 거래 방식입니다.
 */
@ApiTags('거래 (Trade)')
@Controller('trades')
@UseGuards(AuthGuard('jwt'))
export class TradeCompletionController {
  constructor(
    private readonly tradeCompletionService: TradeCompletionService,
  ) {}

  @Post('sales/:saleId/reservation')
  @UseGuards(EmailVerifiedGuard)
  @TrackActivity(ActivityType.SALE_STATUS_CHANGE, (req) => ({
    id: req.params.saleId,
    status: 'RESERVED',
  }))
  @ApiOperation({
    summary: '거래 상대 지정 (예약중 전환)',
    description:
      '판매자가 구매희망자 한 명을 거래 상대로 지정하고 판매글을 예약중으로 바꿉니다. ' +
      '다른 채팅방에는 거래 진행 중 안내가 표시됩니다. 상대는 이 판매글의 ' +
      '채팅방에 남아 있는 사용자만 지정할 수 있습니다.',
  })
  @ApiResponse({ status: 201, description: '예약 처리된 판매글을 반환합니다.' })
  @ApiParam({ name: 'saleId', description: '판매글 ID' })
  async reserve(
    @Param('saleId', ParseIntPipe) saleId: number,
    @CurrentUser() user: User,
    @Body() dto: ReserveSaleDto,
  ) {
    return await this.tradeCompletionService.reserveForBuyer(
      saleId,
      user.id,
      dto.buyerId,
      dto.chatRoomId,
    );
  }

  @Delete('sales/:saleId/reservation')
  @TrackActivity(ActivityType.SALE_STATUS_CHANGE, (req) => ({
    id: req.params.saleId,
    status: 'FOR_SALE',
  }))
  @ApiOperation({
    summary: '거래 상대 지정 취소',
    description: '예약을 취소하고 판매글을 다시 판매중으로 되돌립니다.',
  })
  @ApiResponse({ status: 200, description: '판매중으로 복귀한 판매글' })
  @ApiParam({ name: 'saleId', description: '판매글 ID' })
  async cancelReservation(
    @Param('saleId', ParseIntPipe) saleId: number,
    @CurrentUser() user: User,
  ) {
    return await this.tradeCompletionService.cancelReservation(saleId, user.id);
  }

  @Post('sales/:saleId/completion')
  @UseGuards(EmailVerifiedGuard)
  @TrackActivity(ActivityType.SALE_STATUS_CHANGE, (req) => ({
    id: req.params.saleId,
    status: 'SOLD',
  }))
  @ApiOperation({
    summary: '직거래 완료 처리',
    description:
      '판매글을 판매완료로 바꾸고 거래 완료 기록을 남깁니다. 거래 상대가 ' +
      '지정된 경우에만 완료 기록이 생성되며, 그때부터 양측이 후기를 쓸 수 있습니다. ' +
      '`buyerId`를 생략하면 예약 상대가 자동으로 쓰이고, `withoutCounterparty`를 ' +
      'true로 보내면 예약 상대가 있어도 상대 없이 판매완료만 합니다. ' +
      '거래 상대는 이 판매글로 대화한 적이 있는 사용자만 지정할 수 있습니다.',
  })
  @ApiResponse({
    status: 201,
    description: '판매완료된 판매글과 생성된 완료 기록(없으면 null)',
  })
  @ApiParam({ name: 'saleId', description: '판매글 ID' })
  async complete(
    @Param('saleId', ParseIntPipe) saleId: number,
    @CurrentUser() user: User,
    @Body() dto: CompleteTradeDto,
  ) {
    return await this.tradeCompletionService.completeDirectTrade(
      saleId,
      user.id,
      dto.buyerId,
      dto.chatRoomId,
      dto.withoutCounterparty,
    );
  }

  @Get('sales/:saleId/candidates')
  @ApiOperation({
    summary: '거래 상대 후보 목록',
    description:
      '해당 판매글로 대화한 구매희망자 목록입니다. 마이페이지에서 판매완료로 ' +
      '바꿀 때 거래 상대를 고르는 데 사용합니다.',
  })
  @ApiResponse({ status: 200, description: '거래 상대 후보 목록' })
  @ApiParam({ name: 'saleId', description: '판매글 ID' })
  async findCandidates(
    @Param('saleId', ParseIntPipe) saleId: number,
    @CurrentUser() user: User,
  ) {
    return await this.tradeCompletionService.findTradeCandidates(
      saleId,
      user.id,
    );
  }

  @Get('completions/my')
  @ApiOperation({
    summary: '내 거래 내역',
    description:
      '내가 사거나 판 거래의 완료 내역입니다. 직거래는 주문 기록이 없어 ' +
      '주문 목록에 잡히지 않으므로, 후기를 남길 수 있는 창구가 됩니다.',
  })
  @ApiResponse({ status: 200, description: '거래 완료 내역 목록' })
  async findMyCompletions(
    @CurrentUser() user: User,
    @Query() query: QueryMyCompletionsDto,
  ) {
    return await this.tradeCompletionService.findMyCompletions(user.id, query);
  }

  @Get('completions/by-room/:roomId')
  @ApiOperation({
    summary: '채팅방의 거래 완료 기록 조회',
    description:
      '해당 채팅방에서 성사된 거래 완료 기록을 반환합니다. 없으면 null입니다.',
  })
  @ApiResponse({ status: 200, description: '완료 기록 또는 null' })
  @ApiParam({ name: 'roomId', description: '채팅방 ID' })
  async findByRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @CurrentUser() user: User,
  ) {
    return await this.tradeCompletionService.findByChatRoom(roomId, user.id);
  }

  @Get('completions/:id')
  @ApiOperation({
    summary: '거래 완료 기록 상세 조회',
    description: '거래 당사자만 조회할 수 있습니다.',
  })
  @ApiResponse({ status: 200, description: '완료 기록 상세' })
  @ApiParam({ name: 'id', description: '완료 기록 ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return await this.tradeCompletionService.findForParticipant(id, user.id);
  }
}
