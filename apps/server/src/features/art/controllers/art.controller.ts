import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ArtService } from '../services/art.service';

@ApiTags('공연/예술 (Art)')
@Controller('art')
export class ArtController {
  constructor(private readonly artService: ArtService) {}

  @Get('external/list')
  @ApiOperation({
    summary: '외부 공공 API: 공연 목록 검색 (KOPIS)',
    description: 'KOPIS 공연/예술 목록을 정제 없이 그대로 JSON으로 반환합니다.',
  })
  @ApiQuery({ name: 'cpage', required: false, description: '현재 페이지' })
  @ApiQuery({ name: 'rows', required: false, description: '페이지당 목록 수' })
  @ApiQuery({
    name: 'prfstate',
    required: false,
    description: '공연 상태 (01: 공연예정, 02: 공연중, 03: 공연완료)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '조회 시작일 (YYYYMMDD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '조회 종료일 (YYYYMMDD)',
  })
  @ApiQuery({ name: 'genreCode', required: false, description: '장르 코드' })
  @ApiQuery({ name: 'signgucode', required: false, description: '지역 코드' })
  @ApiResponse({
    status: 200,
    description: '검색된 공연 목록을 반환합니다.',
  })
  async getExternalArtList(
    @Query('cpage') cpage?: string,
    @Query('rows') rows?: string,
    @Query('prfstate') prfstate?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('genreCode') genreCode?: string,
    @Query('signgucode') signgucode?: string,
  ): Promise<Record<string, unknown>> {
    return await this.artService.getExternalArtList({
      cpage,
      rows,
      prfstate,
      startDate,
      endDate,
      genreCode,
      signgucode,
    });
  }

  @Get('external/detail/:id')
  @ApiOperation({
    summary: '외부 공공 API: 공연 상세 조회 (KOPIS)',
    description: 'KOPIS 공연/예술 상세 정보를 정제 없이 JSON으로 반환합니다.',
  })
  @ApiParam({ name: 'id', description: 'KOPIS 공연 ID (mt20id)' })
  @ApiResponse({
    status: 200,
    description: '공연 상세정보를 반환합니다.',
  })
  async getExternalArtDetail(
    @Param('id') id: string,
  ): Promise<Record<string, unknown>> {
    return await this.artService.getExternalArtDetail(id);
  }
}
