import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BookResolvePipe } from '@/features/book/pipes/book-resolve.pipe';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';
import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';

import { WishlistService } from '../services/wishlist.service';

@ApiTags('wishlist')
@Controller('user/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @TrackActivity(ActivityType.WISHLIST_ADD, (req) => ({
    type: req.body.type,
    id: req.body.id,
  }))
  @ApiOperation({
    summary: '위시리스트 추가',
    description: '책이나 판매글을 위시리스트에 추가합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['BOOK', 'SALE'],
          description: '타입 (BOOK, SALE)',
        },
        id: { type: 'string', description: 'ID' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '위시리스트에 추가되었습니다.' })
  async addToWishlist(
    @CurrentUser() user: User,
    @Body(BookResolvePipe)
    body: {
      type: 'BOOK' | 'SALE';
      id: string; // 도서 ISBN 또는 판매글 ID
    },
  ) {
    // SALE 타입인 경우 숫자 ID로 변환하여 처리
    const targetId = body.type === 'BOOK' ? body.id : Number(body.id);
    return await this.wishlistService.addToWishlist(
      user.id,
      body.type,
      targetId,
    );
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  @TrackActivity(ActivityType.WISHLIST_REMOVE, (req) => ({
    type: req.query.type,
    id: req.query.id,
  }))
  @ApiOperation({
    summary: '위시리스트 삭제',
    description: '위시리스트에서 항목을 제거합니다.',
  })
  @ApiQuery({
    name: 'type',
    enum: ['BOOK', 'SALE'],
    description: '타입 (BOOK, SALE)',
  })
  @ApiQuery({ name: 'id', description: 'ID' })
  @ApiResponse({ status: 200, description: '위시리스트에서 제거되었습니다.' })
  async removeFromWishlist(
    @CurrentUser() user: User,
    @Query('type') type: 'BOOK' | 'SALE',
    @Query('id') id: string | number,
  ) {
    return await this.wishlistService.removeFromWishlist(user.id, type, id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '위시리스트 조회',
    description: '나의 위시리스트 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '위시리스트 목록을 반환합니다.' })
  async getWishlist(@CurrentUser() user: User) {
    return await this.wishlistService.getWishlist(user.id);
  }

  @Get('check')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '위시리스트 상태 확인',
    description: '특정 항목이 위시리스트에 있는지 확인합니다.',
  })
  @ApiQuery({
    name: 'type',
    enum: ['BOOK', 'SALE'],
    description: '타입 (BOOK, SALE)',
  })
  @ApiQuery({ name: 'id', description: 'ID' })
  @ApiResponse({
    status: 200,
    description: '위시리스트 포함 여부를 반환합니다.',
  })
  async checkWishlistStatus(
    @CurrentUser() user: User,
    @Query('type') type: 'BOOK' | 'SALE',
    @Query('id') id: string | number,
  ) {
    return await this.wishlistService.checkWishlistStatus(user.id, type, id);
  }
}
