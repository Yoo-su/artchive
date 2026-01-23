import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MODEL_NAME } from '../constants/llm-model';
import { BookSummaryResponseDto } from '../dtos/book-summary-response.dto';
import { getPromptText } from '../utils/get-prompt-text';

import { TalkRequestDto } from '../dtos/talk-request.dto';
import { TalkResponseDto } from '../dtos/talk-response.dto';
import { LlmTalkLog } from '../entities/llm-talk-log.entity';
import { NEOGULIP_CURATION_SYS_PROMPT } from '../constants/neogulip-curation-prompt';

interface CurationResult {
  message: string;
  recommendedBooks: {
    title: string;
    author: string;
    description: string;
  }[];
}

@Injectable()
export class LlmService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  /**
   * ConfigService를 주입받아 API 키를 안전하게 사용합니다.
   */
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(LlmTalkLog)
    private readonly logRepository: Repository<LlmTalkLog>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: MODEL_NAME,
    });
  }

  /**
   * 책 제목과 저자를 기반으로 AI 요약 및 후기를 생성합니다.
   * @param title - 책 제목
   * @param author - 저자
   * @returns 생성된 요약 텍스트
   */
  async generateBookSummary(
    title: string,
    author: string,
    description?: string,
  ): Promise<BookSummaryResponseDto> {
    try {
      const prompt = getPromptText(title, author, description);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // JSON 파싱 시도 (Use unified helper)
      try {
        return this.extractJson<BookSummaryResponseDto>(text);
      } catch (e) {
        console.warn('JSON 파싱 실패, 원본 텍스트 반환', e);
        return { summary: text };
      }
    } catch (error) {
      console.error('Gemini API 호출에 실패했습니다:', error);
      throw new InternalServerErrorException(
        '죄송해요, 책 내용을 읽어오다가 나뭇잎을 놓쳤어요구리! 🍃',
      );
    }
  }
  /**
   * 유저의 입력에 대해 적응형 대화(Adaptive Flow)를 수행하고, 추천이 필요하면 책 검색까지 수행합니다.
   */
  async processTalk(
    dto: TalkRequestDto,
    userId?: string,
  ): Promise<TalkResponseDto> {
    const { message, history } = dto;
    const startTime = Date.now();

    try {
      // 1. [순수 지식 큐레이션]: 검색 과정 없이 바로 LLM이 추천
      // 히스토리와 사용자 메시지를 기반으로 너굴잎이 직접 판단
      const curationResult = await this.curateRecommendations(message, history);

      const duration = Date.now() - startTime;
      const recommendedBooks = curationResult.recommendedBooks || [];

      // 로그 저장
      this.logRepository
        .save({
          userMessage: message,
          aiMessage: curationResult.message,
          recommendedBooks: recommendedBooks,
          model: MODEL_NAME,
          latency: duration,
          userId: userId ?? 'anonymous',
        })
        .catch((e) => console.error(e));

      // 결과 반환
      return {
        message: curationResult.message,
        isFinal: recommendedBooks.length > 0,
        recommendedBooks: recommendedBooks.map((b) => ({
          title: b.title,
          author: b.author,
          description: b.description,
          isbn: '', // LLM generated placeholder
          image: '', // LLM generated placeholder
          publisher: '', // LLM generated placeholder
        })),
      };
    } catch (error: any) {
      console.error('LlmService ProcessTalk Error:', error);

      if (
        error.status === 503 ||
        error.status === 429 ||
        error.message?.includes('503') ||
        error.message?.includes('429')
      ) {
        return {
          message:
            '지금 숲속 도서관에 손님이 너무 많아서 책을 찾을 수가 없어요구리! 🚧\n잠시 뒤에 다시 물어봐주시겠어요? (Gemini 서버 혼잡)',
          isFinal: true,
        };
      }

      throw new InternalServerErrorException(
        '죄송해요, 생각이 엉켜서 넘어졌어요구리! 😵‍💫',
      );
    }
  }

  // --- 헬퍼 메서드 ---

  async curateRecommendations(
    message: string,
    history?: string,
  ): Promise<CurationResult> {
    const prompt = NEOGULIP_CURATION_SYS_PROMPT.replace(
      '${message}',
      message,
    ).replace('${history}', history || '');

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    try {
      return this.extractJson<CurationResult>(text);
    } catch (e) {
      console.warn('LLM Response Parsing Failed:', text);
      // Fallback for parsing error
      return {
        message: '잠시 나뭇잎이 엉켜버렸어요. 다시 한 번 말씀해 주시겠어요? 🍂',
        recommendedBooks: [],
      };
    }
  }

  /**
   * Robust JSON Extractor
   * 1. Tries to parse raw text
   * 2. Tries to find markdown code blocks (```json ... ```)
   * 3. Tries to find the first/last brace pair
   */
  private extractJson<T>(text: string): T {
    // 1. Try raw parsing first
    try {
      return JSON.parse(text);
    } catch {}

    // 2. Try Markdown code blocks
    const match = text.match(/```(?:json)?([\s\S]*?)```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {}
    }

    // 3. Try to find the outermost braces
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      const jsonStr = text.substring(firstOpen, lastClose + 1);
      try {
        return JSON.parse(jsonStr);
      } catch {}
    }

    throw new Error('Failed to extract JSON from response');
  }
}
