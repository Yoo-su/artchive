import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { OptionalJwtAuthGuard } from '@/features/auth/guards/optional-jwt-auth.guard';
import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';

import { BookSummaryDto } from '../dtos/book-summary.dto';
import { BookSummaryResponseDto } from '../dtos/book-summary-response.dto';
import { TalkRequestDto } from '../dtos/talk-request.dto';
import { TalkResponseDto } from '../dtos/talk-response.dto';
import { LlmService } from '../services/llm.service';

@ApiTags('AI 요약 (LLM)')
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('book-summary/:isbn')
  @ApiOperation({
    summary: '저장된 책 요약 조회',
    description: '기존에 생성되어 저장된 AI 도서 요약 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '저장된 요약 정보를 반환하거나 null을 반환합니다.',
  })
  async getSavedBookSummary(
    @Param('isbn') isbn: string,
  ): Promise<BookSummaryResponseDto | null> {
    const saved = await this.llmService.getSavedSummary(isbn);
    if (!saved) {
      return null;
    }
    return {
      summary: saved.summary,
      keyPoints: saved.keyPoints,
      targetAudience: saved.targetAudience,
      keywords: saved.keywords,
    };
  }

  @Post('book-summary')
  @UseGuards(AuthGuard('jwt'))
  @TrackActivity(ActivityType.LLM_BOOK_SUMMARY)
  @ApiOperation({
    summary: '책 요약 생성',
    description: '책 제목과 저자 정보를 바탕으로 AI 요약 및 후기를 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '생성된 요약 정보를 반환합니다.' })
  async getBookSummary(
    @Body(new ValidationPipe()) bookSummaryDto: BookSummaryDto,
    @Req() req: { user?: { id: number | string } },
  ): Promise<BookSummaryResponseDto> {
    const { title, author, description, isbn, publisher } = bookSummaryDto;
    const summary = await this.llmService.generateBookSummary(
      title,
      author,
      description,
      isbn,
      publisher,
      req.user?.id,
    );
    return summary;
  }

  @Post('talk')
  @UseGuards(OptionalJwtAuthGuard)
  @TrackActivity(ActivityType.LLM_TALK)
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
