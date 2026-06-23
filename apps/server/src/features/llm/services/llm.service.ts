import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BookService } from '@/features/book/services/book.service';

import { MODEL_NAME } from '../constants/llm-model';
import { NEOGULIP_CURATION_SYS_PROMPT } from '../constants/neogulip-curation-prompt';
import { BookSummaryResponseDto } from '../dtos/book-summary-response.dto';
import { TalkRequestDto } from '../dtos/talk-request.dto';
import { TalkResponseDto } from '../dtos/talk-response.dto';
import { AiBookSummary } from '../entities/ai-book-summary.entity';
import { LlmTalkLog } from '../entities/llm-talk-log.entity';
import { extractJson } from '../utils/extract-json';
import { getPromptText } from '../utils/get-prompt-text';

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
   * ConfigService와 Repository들을 주입받습니다.
   */
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(LlmTalkLog)
    private readonly logRepository: Repository<LlmTalkLog>,
    @InjectRepository(AiBookSummary)
    private readonly aiBookSummaryRepository: Repository<AiBookSummary>,
    private readonly bookService: BookService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: MODEL_NAME,
    });
  }

  /**
   * DB에서 기 저장된 AI 도서 요약을 조회합니다.
   * @param isbn - 도서 ISBN
   */
  async getSavedSummary(isbn: string): Promise<AiBookSummary | null> {
    return this.aiBookSummaryRepository.findOneBy({ isbn });
  }

  /**
   * 책 제목과 저자를 기반으로 AI 요약 및 후기를 생성하거나 기존 결과를 반환합니다.
   * @param title - 책 제목
   * @param author - 저자
   * @param description - 책 설명
   * @param isbn - 도서 ISBN (저장 및 조회용)
   * @param publisher - 출판사 (선택)
   * @returns 생성되거나 조회된 요약 텍스트
   */
  async generateBookSummary(
    title: string,
    author: string,
    description?: string,
    isbn?: string,
    publisher?: string,
  ): Promise<BookSummaryResponseDto> {
    // 1. 이미 저장된 요약이 있는지 확인
    if (isbn) {
      const saved = await this.getSavedSummary(isbn);
      if (saved) {
        return {
          summary: saved.summary,
          keyPoints: saved.keyPoints,
          targetAudience: saved.targetAudience,
          keywords: saved.keywords,
        };
      }
    }

    try {
      const prompt = getPromptText(title, author, description, publisher);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      let parsedSummary: BookSummaryResponseDto;
      // JSON 파싱 시도 (통합 헬퍼 사용)
      try {
        parsedSummary = extractJson<BookSummaryResponseDto>(text);
      } catch (e) {
        console.warn('JSON 파싱 실패, 원본 텍스트 반환', e);
        parsedSummary = { summary: text };
      }

      // keywords 해시태그 '#' 제거하여 통일
      if (parsedSummary.keywords) {
        parsedSummary.keywords = parsedSummary.keywords.map((k) =>
          k.startsWith('#') ? k.substring(1) : k,
        );
      }

      // 2. 생성에 성공하고 isbn이 존재하는 경우 DB에 캐싱 저장
      if (isbn && parsedSummary.summary) {
        try {
          // DB에 책 기본 정보 생성/조회 보장
          await this.bookService.resolveBook(isbn);

          const summaryEntity = this.aiBookSummaryRepository.create({
            isbn,
            summary: parsedSummary.summary,
            keyPoints: parsedSummary.keyPoints || [],
            targetAudience: parsedSummary.targetAudience || '',
            keywords: parsedSummary.keywords || [],
          });

          await this.aiBookSummaryRepository.save(summaryEntity);
        } catch (dbError) {
          console.error('AI 요약 DB 저장에 실패했습니다:', dbError);
        }
      }

      return parsedSummary;
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
        })),
      };
    } catch (error) {
      console.error('LlmService ProcessTalk Error:', error);

      const isServiceUnavailable =
        error?.status === 503 ||
        error?.status === 429 ||
        error?.message?.includes('503') ||
        error?.message?.includes('429');

      if (isServiceUnavailable) {
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
      return extractJson<CurationResult>(text);
    } catch {
      console.warn('LLM Response Parsing Failed:', text);
      // Fallback for parsing error
      return {
        message: '잠시 나뭇잎이 엉켜버렸어요. 다시 한 번 말씀해 주시겠어요? 🍂',
        recommendedBooks: [],
      };
    }
  }
}
