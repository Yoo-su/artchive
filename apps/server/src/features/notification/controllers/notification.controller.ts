import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';
import { GetNotificationsQueryDto } from '../dto/get-notifications-query.dto';
import { GetNotificationsResponseDto } from '../dto/notification-response.dto';

@ApiTags('알림 (Notification)')
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: '알림 목록 조회',
    description:
      '내 알림 목록을 최신순으로 조회합니다 (커서 기반 페이지네이션).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '알림 목록을 반환합니다.',
    type: GetNotificationsResponseDto,
  })
  async getNotifications(
    @CurrentUser() user: User,
    @Query() query: GetNotificationsQueryDto,
  ): Promise<GetNotificationsResponseDto> {
    return this.notificationService.getNotifications(
      user.id,
      query.cursor,
      query.limit,
    );
  }

  @Get('unread-count')
  @ApiOperation({
    summary: '안 읽은 알림 수 조회',
    description: '확인하지 않은 알림의 개수를 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '안 읽은 알림 수',
    schema: { example: { count: 5 } },
  })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationService.getUnreadCount(user.id);
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({
    summary: '모든 알림 읽음 처리',
    description: '모든 알림을 읽음 상태로 변경합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '성공 여부',
  })
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: '특정 알림 읽음 처리',
    description: '특정 알림 하나를 읽음 상태로 변경합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '성공 여부',
  })
  @ApiParam({ name: 'id', description: '알림 ID' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.notificationService.markAsRead(id, user.id);
  }
  @Delete(':id')
  @ApiOperation({
    summary: '알림 삭제',
    description: '특정 알림을 삭제합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '성공 여부',
  })
  @ApiParam({ name: 'id', description: '알림 ID' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.notificationService.remove(id, user.id);
  }
}
