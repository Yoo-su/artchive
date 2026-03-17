import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { InsightsService } from './insights.service';
import {
  InsightsResponseDto,
  LocationSalesDto,
} from './dto/insights-response.dto';

@ApiTags('insights')
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  /**
   * 서비스 전체 인사이트 데이터를 조회합니다.
   * 로그인 없이 접근 가능합니다.
   */
  @Get()
  @ApiOperation({
    summary: '서비스 인사이트 조회',
    description:
      '전체 서비스 통계 데이터(지역별 거래, 카테고리별 리뷰, 가격 분포 등)를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '인사이트 데이터 조회 성공',
    type: InsightsResponseDto,
  })
  async getInsights(): Promise<InsightsResponseDto> {
    return this.insightsService.getInsights();
  }

  /**
   * 특정 지역(시/도, 시/군/구)의 최근 판매글 5개를 조회합니다.
   */
  @Get('location-sales')
  @ApiOperation({
    summary: '지역별 최근 판매글 조회',
    description: '특정 지역의 최근 판매글 5개를 조회합니다.',
  })
  @ApiQuery({ name: 'city', required: true, description: '시/도' })
  @ApiQuery({ name: 'district', required: true, description: '시/군/구' })
  @ApiResponse({
    status: 200,
    description: '지역별 판매글 조회 성공',
    type: [LocationSalesDto],
  })
  async getLocationSales(
    @Query('city') city: string,
    @Query('district') district: string,
  ): Promise<LocationSalesDto[]> {
    return await this.insightsService.getLocationSales(city, district);
  }
}
