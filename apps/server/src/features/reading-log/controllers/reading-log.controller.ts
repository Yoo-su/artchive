import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReadingLogService } from '../services/reading-log.service';
import { CreateReadingLogDto } from '../dto/create-reading-log.dto';
import { UpdateReadingLogDto } from '../dto/update-reading-log.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateReadingLogSettingsDto } from '../dtos/update-reading-log-settings.dto';

@ApiTags('독서 기록 (Reading Log)')
@Controller('reading-logs')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReadingLogController {
  constructor(private readonly readingLogService: ReadingLogService) {}

  @Post()
  @ApiOperation({
    summary: '독서 기록 생성',
    description: '새로운 독서 기록을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '독서 기록이 성공적으로 생성되었습니다.',
  })
  create(@Request() req, @Body() createReadingLogDto: CreateReadingLogDto) {
    return this.readingLogService.create(req.user.id, createReadingLogDto);
  }

  @Get()
  @ApiOperation({
    summary: '월별 독서 기록 조회',
    description: '특정 연도와 월의 독서 기록 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '해당 월의 독서 기록 목록을 반환합니다.',
  })
  @ApiQuery({ name: 'year', description: '조회할 연도 (YYYY)', example: 2023 })
  @ApiQuery({ name: 'month', description: '조회할 월 (1-12)', example: 10 })
  findAll(
    @Request() req,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.readingLogService.findAllByMonth(req.user.id, year, month);
  }

  @Get('stats')
  @ApiOperation({
    summary: '독서 통계 조회',
    description: '이번 달/올해 읽은 권수를 반환합니다.',
  })
  @ApiQuery({ name: 'year', example: 2024 })
  @ApiQuery({ name: 'month', example: 1 })
  getStats(
    @Request() req,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.readingLogService.getStats(req.user.id, year, month);
  }

  @Get('settings')
  @ApiOperation({
    summary: '독서 기록 설정 조회',
    description: '독서 기록 공개 여부 등 설정을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '독서 기록 설정을 반환합니다.',
  })
  getSettings(@Request() req) {
    return this.readingLogService.getSettings(req.user.id);
  }

  @Patch('settings')
  @ApiOperation({
    summary: '독서 기록 설정 수정',
    description: '독서 기록 공개 여부를 수정합니다.',
  })
  @ApiBody({ type: UpdateReadingLogSettingsDto })
  @ApiResponse({
    status: 200,
    description: '수정된 독서 기록 설정 정보를 반환합니다.',
  })
  updateSettings(@Request() req, @Body() dto: UpdateReadingLogSettingsDto) {
    return this.readingLogService.updateSettings(
      req.user.id,
      dto.isReadingLogPublic,
    );
  }

  @Get('list')
  @ApiOperation({
    summary: '독서 기록 리스트 조회 (Infinite Scroll)',
    description: '독서 기록을 커서 기반 페이지네이션으로 조회합니다.',
  })
  @ApiQuery({
    name: 'cursorId',
    required: false,
    description: '마지막 로드된 ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '가져올 개수 (기본 10)',
  })
  findAllInfinite(
    @Request() req,
    @Query('cursorId') cursorId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.readingLogService.findAllInfinite(
      req.user.id,
      cursorId,
      limit ? Number(limit) : 10,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: '독서 기록 수정',
    description: '기존 독서 기록의 메모 등을 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '독서 기록이 성공적으로 수정되었습니다.',
  })
  @ApiResponse({ status: 404, description: '해당 기록을 찾을 수 없습니다.' })
  @ApiParam({ name: 'id', description: '독서 기록 ID' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateReadingLogDto: UpdateReadingLogDto,
  ) {
    return this.readingLogService.update(req.user.id, id, updateReadingLogDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '독서 기록 삭제',
    description: '특정 독서 기록을 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '독서 기록이 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({ status: 404, description: '해당 기록을 찾을 수 없습니다.' })
  @ApiParam({ name: 'id', description: '독서 기록 ID' })
  remove(@Request() req, @Param('id') id: string) {
    return this.readingLogService.remove(req.user.id, id);
  }
}
