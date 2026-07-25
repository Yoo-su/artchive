import {
  GenerativeModel,
  GoogleGenerativeAI,
  Schema,
  SchemaType,
} from '@google/generative-ai';
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
import { AiRequestLog } from '../entities/ai-request-log.entity';
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

interface CurationResultWithMeta {
  curation: CurationResult;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
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
    @InjectRepository(AiRequestLog)
    private readonly aiRequestLogRepository: Repository<AiRequestLog>,
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
   */
  async generateBookSummary(
    title: string,
    author: string,
    description?: string,
    isbn?: string,
    publisher?: string,
    userId?: string | number,
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

    const startTime = Date.now();
    const parsedUserId =
      userId !== undefined && userId !== null && !isNaN(Number(userId))
        ? Number(userId)
        : null;

    try {
      const prompt = getPromptText(title, author, description, publisher);

      const bookSummarySchema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
          summary: {
            type: SchemaType.STRING,
            description:
              '도서의 구체적 서사와 핵심 갈등을 담은 공백 포함 250~350자 내외의 1개 완성형 문단',
          },
          keyPoints: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '핵심 인사이트 리스트 3개',
          },
          targetAudience: {
            type: SchemaType.STRING,
            description: '추천하는 독자의 구체적 상황이나 고민',
          },
          keywords: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '책과 연관된 태그(키워드) 목록 5개',
          },
        },
        required: ['summary', 'keyPoints', 'targetAudience', 'keywords'],
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: bookSummarySchema,
          temperature: 0.2,
        },
      });
      const latencyMs = Date.now() - startTime;
      const response = result.response;
      const text = response.text();
      const usageMetadata = response.usageMetadata;

      let parsedSummary: BookSummaryResponseDto;
      try {
        parsedSummary = extractJson<BookSummaryResponseDto>(text);
      } catch (e) {
        console.warn('JSON 파싱 실패, 원본 텍스트 반환', e);
        parsedSummary = { summary: text };
      }

      if (parsedSummary.keywords) {
        parsedSummary.keywords = parsedSummary.keywords.map((k) =>
          k.startsWith('#') ? k.substring(1) : k,
        );
      }

      // AI 로그 저장 (성공)
      this.aiRequestLogRepository
        .save({
          userId: parsedUserId,
          feature: 'BOOK_SUMMARY',
          model: MODEL_NAME,
          promptTokens: usageMetadata?.promptTokenCount ?? null,
          completionTokens: usageMetadata?.candidatesTokenCount ?? null,
          totalTokens: usageMetadata?.totalTokenCount ?? null,
          latencyMs,
          requestPayload: { title, author, description, isbn, publisher },
          responsePayload: parsedSummary as unknown as Record<string, unknown>,
          status: 'SUCCESS',
        })
        .catch((e) =>
          console.error('Failed to save AI log for BOOK_SUMMARY:', e),
        );

      // 2. 생성에 성공하고 isbn이 존재하는 경우 DB에 캐싱 저장
      if (isbn && parsedSummary.summary) {
        try {
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
      const latencyMs = Date.now() - startTime;
      this.aiRequestLogRepository
        .save({
          userId: parsedUserId,
          feature: 'BOOK_SUMMARY',
          model: MODEL_NAME,
          latencyMs,
          requestPayload: { title, author, description, isbn, publisher },
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : String(error),
        })
        .catch((e) =>
          console.error('Failed to save AI error log for BOOK_SUMMARY:', e),
        );

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
    userId?: string | number,
  ): Promise<TalkResponseDto> {
    const { message, history } = dto;
    const startTime = Date.now();
    const parsedUserId =
      userId !== undefined && userId !== null && !isNaN(Number(userId))
        ? Number(userId)
        : null;

    try {
      const { curation, usageMetadata } =
        await this.curateRecommendationsWithMeta(message, history);

      const latencyMs = Date.now() - startTime;
      const recommendedBooks = curation.recommendedBooks || [];

      // AI 로그 저장 (성공)
      this.aiRequestLogRepository
        .save({
          userId: parsedUserId,
          feature: 'TALK',
          model: MODEL_NAME,
          promptTokens: usageMetadata?.promptTokenCount ?? null,
          completionTokens: usageMetadata?.candidatesTokenCount ?? null,
          totalTokens: usageMetadata?.totalTokenCount ?? null,
          latencyMs,
          requestPayload: { message, history: history ?? null },
          responsePayload: {
            message: curation.message,
            recommendedBooks,
            isFinal: recommendedBooks.length > 0,
          },
          status: 'SUCCESS',
        })
        .catch((e) => console.error('Failed to save AI log for TALK:', e));

      return {
        message: curation.message,
        isFinal: recommendedBooks.length > 0,
        recommendedBooks: recommendedBooks.map((b) => ({
          title: b.title,
          author: b.author,
          description: b.description,
        })),
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      this.aiRequestLogRepository
        .save({
          userId: parsedUserId,
          feature: 'TALK',
          model: MODEL_NAME,
          latencyMs,
          requestPayload: { message, history: history ?? null },
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : String(error),
        })
        .catch((e) =>
          console.error('Failed to save AI error log for TALK:', e),
        );

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
    const res = await this.curateRecommendationsWithMeta(message, history);
    return res.curation;
  }

  async curateRecommendationsWithMeta(
    message: string,
    history?: string,
  ): Promise<CurationResultWithMeta> {
    const prompt = NEOGULIP_CURATION_SYS_PROMPT.replace(
      '${message}',
      message,
    ).replace('${history}', history || '');

    const result = await this.model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    try {
      const curation = extractJson<CurationResult>(text);
      return {
        curation,
        usageMetadata: response.usageMetadata,
      };
    } catch {
      console.warn('LLM Response Parsing Failed:', text);
      return {
        curation: {
          message:
            '잠시 나뭇잎이 엉켜버렸어요. 다시 한 번 말씀해 주시겠어요? 🍂',
          recommendedBooks: [],
        },
        usageMetadata: response.usageMetadata,
      };
    }
  }
}
