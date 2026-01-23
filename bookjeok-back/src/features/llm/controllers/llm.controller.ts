import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '@/features/auth/guards/optional-jwt-auth.guard';
import { LlmService } from '../services/llm.service';
import { BookSummaryDto } from '../dtos/book-summary.dto';
import { TalkRequestDto } from '../dtos/talk-request.dto';
import { TalkResponseDto } from '../dtos/talk-response.dto';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('AI 요약 (LLM)')
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('book-summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '책 요약 생성',
    description: '책 제목과 저자 정보를 바탕으로 AI 요약 및 후기를 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '생성된 요약 정보를 반환합니다.' })
  async getBookSummary(
    @Body(new ValidationPipe()) bookSummaryDto: BookSummaryDto,
  ) {
    const { title, author, description } = bookSummaryDto;
    const summary = await this.llmService.generateBookSummary(
      title,
      author,
      description,
    );
    return summary;
  }

  @Post('talk')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'AI 사서와 대화 (추천)',
    description:
      '유저의 입력에 따라 AI가 추가 질문을 하거나(isFinal=false), 최종 책 추천을 합니다(isFinal=true).',
  })
  @ApiResponse({
    status: 201,
    description: '대화 응답(질문 또는 추천)을 반환합니다.',
  })
  talk(
    @Body() dto: TalkRequestDto,
    @Req() req: { user?: { id: string } },
  ): Promise<TalkResponseDto> {
    return this.llmService.processTalk(dto, req.user?.id);
  }
}
