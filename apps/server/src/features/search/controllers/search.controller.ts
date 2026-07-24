import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  AiSearchRequestDto,
  AiSearchResponseDto,
} from '@/features/search/dtos/ai-search.dto';
import { SearchService } from '@/features/search/services/search.service';

@ApiTags('도서 AI 검색 (AI Search)')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('ai')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 1분당 최대 10회 호출 제한 (인증된 사용자 전용)
  @ApiOperation({
    summary: 'AI 추천 도서 검색 (Semantic Search + RAG)',
    description:
      '회원 전용 기능입니다. 사용자의 자연어 질문을 vector(768)로 임베딩 후 pgvector로 유사 도서를 탐색하고, Gemini Flash로 맞춤 추천 코멘트를 합성해 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'AI 도서 추천 결과 및 코멘트를 반환합니다.',
    type: AiSearchResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 유저의 접근입니다 (로그인 필요).',
  })
  async searchAi(
    @Body() dto: AiSearchRequestDto,
  ): Promise<AiSearchResponseDto> {
    return await this.searchService.searchAi(dto);
  }
}
