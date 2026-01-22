import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MODEL_NAME } from '../constants/llm-model';
import { BookSummaryResponseDto } from '../dtos/book-summary-response.dto';
import { getPromptText } from '../utils/get-prompt-text';

import { NaverBookSearchService } from '@/features/book/services/naver-book-search.service';
import { TalkRequestDto } from '../dtos/talk-request.dto';
import { TalkResponseDto } from '../dtos/talk-response.dto';
import { LlmTalkLog } from '../entities/llm-talk-log.entity';
import { NEOGULIP_SEARCH_SYS_PROMPT } from '../constants/neogulip-search-prompt';
import { NEOGULIP_CURATION_SYS_PROMPT } from '../constants/neogulip-curation-prompt';
import { Book } from '@/features/book/entities/book.entity';

@Injectable()
export class LlmService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  /**
   * ConfigService를 주입받아 API 키를 안전하게 사용합니다.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly naverBookSearchService: NaverBookSearchService,
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

      // JSON 파싱 시도
      try {
        // 마크다운 코드 블록 제거 (```json ... ```)
        const cleanedText = text.replace(/```json\n|\n```/g, '').trim();
        return JSON.parse(cleanedText) as BookSummaryResponseDto;
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
  async processTalk(dto: TalkRequestDto): Promise<TalkResponseDto> {
    const { message, history } = dto;
    const startTime = Date.now();

    try {
      // 1. [의도 분석]: 사용자 의도 파악 및 검색 쿼리 생성
      const searchAnalysis = await this.analyzeIntent(message, history);

      // 2. [질문 흐름]: 단순 질문이나 일상 대화인 경우 (검색 불필요)
      if (
        searchAnalysis.type === 'QUESTION' ||
        searchAnalysis.queries.length === 0
      ) {
        // 후보 도서 없이 큐레이션 프롬프트로 자연스러운 대화 생성
        const chatResult = await this.curateRecommendations(message, []);
        return {
          message: chatResult.message,
          isFinal: false,
        };
      }

      // 3. [정보 검색]: 네이버 책 검색 API를 통해 후보 도서 수집
      // 응답 속도 및 쿼터 제한을 고려하여 최대 3개의 쿼리만 병렬로 실행
      const queries = searchAnalysis.queries.slice(0, 3);
      const searchPromises = queries.map((q) =>
        this.naverBookSearchService.search(q, 5, 1, 'sim'),
      );

      const rawResults = await Promise.all(searchPromises);

      // 검색 결과 병합 및 ISBN 기준 중복 제거
      const candidateMap = new Map<string, Partial<Book>>();
      rawResults.flat().forEach((book) => {
        if (book && book.isbn) {
          candidateMap.set(book.isbn, book);
        }
      });
      const candidates = Array.from(candidateMap.values());

      // 4. [큐레이션]: 수집된 후보군 중에서 LLM이 베스트 도서 선별
      const curationResult = await this.curateRecommendations(
        message,
        candidates,
      );

      // 5. [응답 생성]: 선별된 ISBN을 전체 도서 객체로 변환
      const finalBooks = curationResult.recommendedIsbns
        .map((isbn) => candidateMap.get(isbn))
        .filter((b): b is Partial<Book> => b !== undefined);

      const duration = Date.now() - startTime;

      // 로그 저장
      this.logRepository
        .save({
          userMessage: message,
          aiMessage: curationResult.message,
          analysis: JSON.stringify(searchAnalysis),
          recommendedTitles: finalBooks
            .map((b) => b.title)
            .filter((t): t is string => !!t),
          model: MODEL_NAME,
          latency: duration,
          userId: 'anonymous',
        })
        .catch((e) => console.error(e));

      // 6. 결과 반환
      if (finalBooks.length > 0) {
        return {
          message: curationResult.message,
          isFinal: true,
          recommendedBooks: finalBooks,
        };
      } else {
        // 큐레이션 결과가 없거나 검색된 책이 없는 경우에 대한 처리 (사과 메시지 등)
        return {
          message: curationResult.message, // 캐릭터 톤으로 사과 메시지가 이미 포함되어 있음
          isFinal: false,
        };
      }
    } catch (error: any) {
      console.error('LlmService ProcessTalk Error:', error);

      // 구글 Gemini API 503 (Service Unavailable) 또는 429 (Too Many Requests) 처리
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

  async analyzeIntent(
    message: string,
    history?: string,
  ): Promise<{ type: 'SEARCH' | 'QUESTION'; queries: string[] }> {
    const prompt = NEOGULIP_SEARCH_SYS_PROMPT.replace(
      '${message}',
      message,
    ).replace('${history}', history || '');

    const result = await this.model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json\n|\n```/g, '')
      .trim();
    try {
      return JSON.parse(text) as {
        type: 'SEARCH' | 'QUESTION';
        queries: string[];
      };
    } catch {
      // 실패 시 기본 질문 모드로 전환
      return { type: 'QUESTION', queries: [] };
    }
  }

  async curateRecommendations(
    message: string,
    candidates: any[],
  ): Promise<{ message: string; recommendedIsbns: string[] }> {
    // 검색 결과를 LLM이 이해하기 쉽게 문자열로 요약 (토큰 효율화)
    const candidatesStr = JSON.stringify(
      candidates.map((b) => ({
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        publisher: b.publisher,
      })),
    );

    const prompt = NEOGULIP_CURATION_SYS_PROMPT.replace(
      '${message}',
      message,
    ).replace('${candidates}', candidatesStr);

    const result = await this.model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json\n|\n```/g, '')
      .trim();
    try {
      return JSON.parse(text) as {
        message: string;
        recommendedIsbns: string[];
      };
    } catch {
      return {
        message: '죄송해요, 책을 고르다가 잠들었어요구리... 💤',
        recommendedIsbns: [],
      };
    }
  }
}
