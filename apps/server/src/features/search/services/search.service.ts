import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { Repository } from 'typeorm';

import { MODEL_NAME } from '@/features/llm/constants/llm-model';
import { AiRequestLog } from '@/features/llm/entities/ai-request-log.entity';
import {
  AiSearchRequestDto,
  AiSearchResponseDto,
  ChatMessageDto,
} from '@/features/search/dtos/ai-search.dto';
import { EmbeddingService } from '@/features/search/services/embedding.service';
import { RagService } from '@/features/search/services/rag.service';
import { VectorSearchService } from '@/features/search/services/vector-search.service';

import { deduplicateBooks } from '../utils/book-deduplicator.util';
import { SseStreamWriter } from '../utils/sse-stream-writer';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly SIMILARITY_THRESHOLD = 0.35; // 최소 유사도 기준값
  private readonly CANDIDATE_POOL_SIZE = 30; // pgvector에서 검색할 원시 후보 풀 크기

  constructor(
    @InjectRepository(AiRequestLog)
    private readonly aiRequestLogRepository: Repository<AiRequestLog>,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Conversational Agent RAG Pipeline (동기 처리)
   */
  async searchAi(
    dto: AiSearchRequestDto,
    userId?: number,
  ): Promise<AiSearchResponseDto> {
    const startTime = Date.now();
    const { messages } = dto;

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;

    if (!messages || messages.length === 0) {
      return {
        message: '안녕하세요! 어떤 책을 찾고 계신가요? 편안하게 말씀해 주세요.',
        books: [],
      };
    }

    try {
      // 1. 1차 의도 분류 및 도서 검색 여부 판단
      const turnResult =
        await this.ragService.processConversationalTurn(messages);

      if (turnResult.usageMetadata) {
        totalPromptTokens += turnResult.usageMetadata.promptTokenCount ?? 0;
        totalCompletionTokens +=
          turnResult.usageMetadata.candidatesTokenCount ?? 0;
        totalTokens += turnResult.usageMetadata.totalTokenCount ?? 0;
      }

      // 1-A. 일반 대화/안내인 경우 (search_books 미호출 시 임베딩 API 호출 없이 즉시 반환)
      if (!turnResult.searchQueryRequested) {
        await this.logSuccess({
          userId,
          startTime,
          messages,
          responseMessage: turnResult.message,
          books: [],
          tokens: {
            prompt: totalPromptTokens,
            completion: totalCompletionTokens,
            total: totalTokens,
          },
        });

        return {
          message: turnResult.message,
          books: [],
        };
      }

      // 2. 도서 검색 실행 (LLM이 대화 맥락을 파악해 정제한 검색어로 임베딩 생성)
      const queryVector = await this.embeddingService.generateQueryEmbedding(
        turnResult.searchQueryRequested,
      );

      const rawBooks = await this.vectorSearchService.searchSimilarBooks(
        queryVector,
        this.CANDIDATE_POOL_SIZE,
      );

      const filteredBooks = rawBooks.filter(
        (b) => b.similarity >= this.SIMILARITY_THRESHOLD,
      );

      // 2-B. 제외 키워드 필터링, 출판사 정렬, 시리즈/상하권 중복 제거
      const deduplicated = deduplicateBooks(
        filteredBooks,
        turnResult.preferredPublishers,
        turnResult.excludedKeywords,
      );
      const targetCount = turnResult.targetCount || 5;

      const hasPublisherConstraint =
        turnResult.preferredPublishers &&
        turnResult.preferredPublishers.length > 0;
      const matchingPublisherBooks = hasPublisherConstraint
        ? deduplicated.filter((b) =>
            turnResult.preferredPublishers?.some((pub) =>
              b.publisher?.includes(pub),
            ),
          )
        : deduplicated;

      const curatedBooks = (
        hasPublisherConstraint ? matchingPublisherBooks : deduplicated
      ).slice(0, targetCount);

      // 2-C. DB 검색 결과가 없거나 특정 제약조건에 부합하는 도서가 없을 때: 모델 자체 지식으로 도서 추천
      if (curatedBooks.length === 0) {
        const parametricResult =
          await this.ragService.generateParametricRecommendation(
            messages,
            turnResult.searchQueryRequested,
            targetCount,
          );

        await this.logSuccess({
          userId,
          startTime,
          messages,
          responseMessage: parametricResult.message,
          books: [],
          tokens: {
            prompt: parametricResult.usageMetadata?.promptTokenCount ?? 0,
            completion:
              parametricResult.usageMetadata?.candidatesTokenCount ?? 0,
            total: parametricResult.usageMetadata?.totalTokenCount ?? 0,
          },
        });

        return {
          message: parametricResult.message,
          books: [],
        };
      }

      // 3. 2차 LLM: 도서별 맞춤 추천 사유(reason) 및 총평(message) 생성
      const synthesisResult =
        await this.ragService.filterAndSynthesizeRecommendation(
          messages,
          curatedBooks,
        );

      if (synthesisResult.usageMetadata) {
        totalPromptTokens +=
          synthesisResult.usageMetadata.promptTokenCount ?? 0;
        totalCompletionTokens +=
          synthesisResult.usageMetadata.candidatesTokenCount ?? 0;
        totalTokens += synthesisResult.usageMetadata.totalTokenCount ?? 0;
      }

      await this.logSuccess({
        userId,
        startTime,
        messages,
        responseMessage: synthesisResult.message,
        books: synthesisResult.books,
        tokens: {
          prompt: totalPromptTokens,
          completion: totalCompletionTokens,
          total: totalTokens,
        },
      });

      return {
        message: synthesisResult.message,
        books: synthesisResult.books,
      };
    } catch (error) {
      await this.logError(userId, startTime, messages, error);
      throw error;
    }
  }

  /**
   * Conversational Agent RAG Pipeline - 실시간 SSE 스트리밍
   */
  async searchAiStream(
    dto: AiSearchRequestDto,
    res: Response,
    userId?: number,
  ): Promise<void> {
    const startTime = Date.now();
    const { messages } = dto;
    const sse = new SseStreamWriter(res);

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let fullTextAccumulator = '';

    if (!messages || messages.length === 0) {
      sse.sendTextChunk(
        '안녕하세요! 어떤 책을 찾고 계신가요? 편안하게 말씀해 주세요.',
      );
      sse.complete();
      return;
    }

    try {
      let searchQueryRequested: string | null = null;
      let targetCount = 5;
      let preferredPublishers: string[] = [];
      let excludedKeywords: string[] = [];

      // 1. 1차 턴 스트리밍 (일반 대화 시 즉시 실시간 토큰 전송, 검색 필요 시 function_call 반환)
      for await (const event of this.ragService.processConversationalTurnStream(
        messages,
      )) {
        if (!sse.isConnected) break;

        if (event.type === 'function_call') {
          searchQueryRequested = event.searchQueryRequested || null;
          targetCount = event.targetCount || 5;
          preferredPublishers = event.preferredPublishers || [];
          excludedKeywords = event.excludedKeywords || [];
          fullTextAccumulator = '';
          break;
        } else if (event.type === 'chunk' && event.chunk) {
          fullTextAccumulator += event.chunk;
          sse.sendTextChunk(event.chunk);
        } else if (event.type === 'error') {
          sse.sendError(
            event.errorMessage ||
              '대화를 처리하는 도중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          );
          return;
        } else if (event.type === 'done' && event.usageMetadata) {
          totalPromptTokens += event.usageMetadata.promptTokenCount ?? 0;
          totalCompletionTokens +=
            event.usageMetadata.candidatesTokenCount ?? 0;
          totalTokens += event.usageMetadata.totalTokenCount ?? 0;
        }
      }

      // 1-A. 단순 대화 또는 꼬리 질문인 경우 (search_books 미호출)
      if (!searchQueryRequested) {
        sse.complete();

        await this.logSuccess({
          userId,
          startTime,
          messages,
          responseMessage: fullTextAccumulator,
          books: [],
          tokens: {
            prompt: totalPromptTokens,
            completion: totalCompletionTokens,
            total: totalTokens,
          },
        });
        return;
      }

      // 2. 도서 검색 진행 알림 전송 (1차 턴에서 도서 검색이 확정된 경우만 발송)
      sse.sendSearching(
        '도서 데이터베이스에서 맞춤 도서를 탐색하고 있습니다...',
      );

      const queryVector =
        await this.embeddingService.generateQueryEmbedding(
          searchQueryRequested,
        );

      const rawBooks = await this.vectorSearchService.searchSimilarBooks(
        queryVector,
        this.CANDIDATE_POOL_SIZE,
      );

      const filteredBooks = rawBooks.filter(
        (b) => b.similarity >= this.SIMILARITY_THRESHOLD,
      );

      // 2-B. 제외 키워드 필터링, 출판사 정렬, 시리즈/상하권 중복 제거
      const deduplicated = deduplicateBooks(
        filteredBooks,
        preferredPublishers,
        excludedKeywords,
      );

      const hasPublisherConstraint = preferredPublishers.length > 0;
      const matchingPublisherBooks = hasPublisherConstraint
        ? deduplicated.filter((b) =>
            preferredPublishers.some((pub) => b.publisher?.includes(pub)),
          )
        : deduplicated;

      const curatedBooks = (
        hasPublisherConstraint ? matchingPublisherBooks : deduplicated
      ).slice(0, targetCount);

      // 2-C. DB 검색 결과가 없거나 특정 조건의 도서가 없을 때: 모델 자체 지식으로 도서 추천 큐레이션 스트리밍
      if (curatedBooks.length === 0) {
        for await (const chunkEvent of this.ragService.generateParametricRecommendationStream(
          messages,
          searchQueryRequested,
          targetCount,
        )) {
          if (!sse.isConnected) break;
          if (chunkEvent.type === 'chunk' && chunkEvent.chunk) {
            fullTextAccumulator += chunkEvent.chunk;
            sse.sendTextChunk(chunkEvent.chunk);
          } else if (chunkEvent.type === 'done' && chunkEvent.usageMetadata) {
            totalPromptTokens += chunkEvent.usageMetadata.promptTokenCount ?? 0;
            totalCompletionTokens +=
              chunkEvent.usageMetadata.candidatesTokenCount ?? 0;
            totalTokens += chunkEvent.usageMetadata.totalTokenCount ?? 0;
          }
        }

        sse.complete();

        await this.logSuccess({
          userId,
          startTime,
          messages,
          responseMessage: fullTextAccumulator,
          books: [],
          tokens: {
            prompt: totalPromptTokens,
            completion: totalCompletionTokens,
            total: totalTokens,
          },
        });
        return;
      }

      // 3. 2차 RAG: 도서별 맞춤 추천 사유(reason) 및 정갈한 총평 메시지(message) 생성
      const synthesisResult =
        await this.ragService.filterAndSynthesizeRecommendation(
          messages,
          curatedBooks,
        );

      if (synthesisResult.usageMetadata) {
        totalPromptTokens +=
          synthesisResult.usageMetadata.promptTokenCount ?? 0;
        totalCompletionTokens +=
          synthesisResult.usageMetadata.candidatesTokenCount ?? 0;
        totalTokens += synthesisResult.usageMetadata.totalTokenCount ?? 0;
      }

      // 4. 추천 사유가 포함된 도서 카드 목록 선발송 (슬라이더에 '추천 까닭' 완벽 표기)
      sse.sendBooks(synthesisResult.books);

      // 5. 정갈한 총평 메시지 전송
      fullTextAccumulator = synthesisResult.message;
      sse.sendTextChunk(synthesisResult.message);
      sse.complete();

      await this.logSuccess({
        userId,
        startTime,
        messages,
        responseMessage: fullTextAccumulator,
        books: synthesisResult.books,
        tokens: {
          prompt: totalPromptTokens,
          completion: totalCompletionTokens,
          total: totalTokens,
        },
      });
    } catch (error) {
      this.logger.error('searchAiStream Error:', error);
      sse.sendError(
        '대화를 처리하는 도중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
      await this.logError(userId, startTime, messages, error);
    }
  }

  /**
   * AI 성공 감사 로그 기록 헬퍼
   */
  private async logSuccess(params: {
    userId?: number;
    startTime: number;
    messages: ChatMessageDto[];
    responseMessage: string;
    books: unknown[];
    tokens: { prompt: number; completion: number; total: number };
  }): Promise<void> {
    const latencyMs = Date.now() - params.startTime;
    await this.saveAiLog({
      userId: params.userId ?? null,
      feature: 'TALK',
      model: MODEL_NAME,
      promptTokens: params.tokens.prompt || null,
      completionTokens: params.tokens.completion || null,
      totalTokens: params.tokens.total || null,
      latencyMs,
      requestPayload: { messages: params.messages },
      responsePayload: {
        message: params.responseMessage,
        books: params.books,
      },
      status: 'SUCCESS',
    });
  }

  /**
   * AI 오류 감사 로그 기록 헬퍼
   */
  private async logError(
    userId: number | undefined,
    startTime: number,
    messages: ChatMessageDto[],
    error: unknown,
  ): Promise<void> {
    const latencyMs = Date.now() - startTime;
    await this.saveAiLog({
      userId: userId ?? null,
      feature: 'TALK',
      model: MODEL_NAME,
      latencyMs,
      requestPayload: { messages },
      status: 'ERROR',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }

  /**
   * 비동기 AI 로그 DB 저장
   */
  private async saveAiLog(logData: Partial<AiRequestLog>): Promise<void> {
    try {
      const log = this.aiRequestLogRepository.create(logData);
      await this.aiRequestLogRepository.save(log);
    } catch (err) {
      this.logger.error('Failed to save AI log:', err);
    }
  }
}
