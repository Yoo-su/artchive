import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MODEL_NAME } from '@/features/llm/constants/llm-model';
import { AiRequestLog } from '@/features/llm/entities/ai-request-log.entity';
import {
  AiSearchRequestDto,
  AiSearchResponseDto,
} from '@/features/search/dtos/ai-search.dto';
import { EmbeddingService } from '@/features/search/services/embedding.service';
import { RagService } from '@/features/search/services/rag.service';
import { VectorSearchService } from '@/features/search/services/vector-search.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly SIMILARITY_THRESHOLD = 0.35; // 최소 유사도 기준값
  private readonly CANDIDATE_POOL_SIZE = 15; // pgvector에서 뽑아올 후보 풀 크기 (25 → 15로 축소)
  private readonly MAX_CANDIDATES_FOR_LLM = 10; // LLM에 전달할 최대 후보 수

  constructor(
    @InjectRepository(AiRequestLog)
    private readonly aiRequestLogRepository: Repository<AiRequestLog>,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Conversational Agent RAG Pipeline (Speculative Embedding 적용)
   *
   * 1차 LLM 호출과 임베딩을 병렬로 실행하여 레이턴시를 절감합니다.
   * LLM이 검색 불필요로 판단하면 투기적 임베딩은 버려지고 (비용 무시할 수준),
   * LLM이 원문과 동일한 쿼리를 반환하면 투기적 임베딩 결과를 그대로 사용합니다.
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
      const lastUserMessage = messages[messages.length - 1]?.content ?? '';

      // 1. Speculative Embedding: 1차 LLM 호출과 동시에 사용자 원문으로 임베딩 시작
      const [turnResult, speculativeVector] = await Promise.all([
        this.ragService.processConversationalTurn(messages),
        this.embeddingService.generateQueryEmbedding(lastUserMessage),
      ]);

      if (turnResult.usageMetadata) {
        totalPromptTokens += turnResult.usageMetadata.promptTokenCount ?? 0;
        totalCompletionTokens +=
          turnResult.usageMetadata.candidatesTokenCount ?? 0;
        totalTokens += turnResult.usageMetadata.totalTokenCount ?? 0;
      }

      // 1-A. AI가 대화/질문만 진행하기로 한 경우 (search_books 도구를 호출하지 않음)
      if (!turnResult.searchQueryRequested) {
        const latencyMs = Date.now() - startTime;
        await this.saveAiLog({
          userId: userId ?? null,
          feature: 'TALK',
          model: MODEL_NAME,
          promptTokens: totalPromptTokens || null,
          completionTokens: totalCompletionTokens || null,
          totalTokens: totalTokens || null,
          latencyMs,
          requestPayload: { messages },
          responsePayload: { message: turnResult.message, books: [] },
          status: 'SUCCESS',
        });

        return {
          message: turnResult.message,
          books: [],
        };
      }

      // 2. LLM이 정제된 searchQuery를 생성했으면 재임베딩, 아니면 투기적 결과 사용
      const queryVector =
        turnResult.searchQueryRequested !== lastUserMessage
          ? await this.embeddingService.generateQueryEmbedding(
              turnResult.searchQueryRequested,
            )
          : speculativeVector;

      const rawBooks = await this.vectorSearchService.searchSimilarBooks(
        queryVector,
        this.CANDIDATE_POOL_SIZE,
      );

      const filteredBooks = rawBooks.filter(
        (b) => b.similarity >= this.SIMILARITY_THRESHOLD,
      );

      if (filteredBooks.length === 0) {
        const latencyMs = Date.now() - startTime;
        const noResultMessage =
          '말씀하신 상황과 어울리는 도서를 데이터베이스에서 찾지 못했습니다. 원하시는 분위기나 관심 장르를 다르게 말씀해 주시겠어요?';

        await this.saveAiLog({
          userId: userId ?? null,
          feature: 'TALK',
          model: MODEL_NAME,
          promptTokens: totalPromptTokens || null,
          completionTokens: totalCompletionTokens || null,
          totalTokens: totalTokens || null,
          latencyMs,
          requestPayload: { messages },
          responsePayload: { message: noResultMessage, books: [] },
          status: 'SUCCESS',
        });

        return {
          message: noResultMessage,
          books: [],
        };
      }

      // 3. 통합 RAG Reranking & Synthesis (2차 LLM 호출) — 상위 MAX_CANDIDATES_FOR_LLM개만 전달
      const finalResult =
        await this.ragService.filterAndSynthesizeRecommendation(
          messages,
          filteredBooks.slice(0, this.MAX_CANDIDATES_FOR_LLM),
        );

      if (finalResult.usageMetadata) {
        totalPromptTokens += finalResult.usageMetadata.promptTokenCount ?? 0;
        totalCompletionTokens +=
          finalResult.usageMetadata.candidatesTokenCount ?? 0;
        totalTokens += finalResult.usageMetadata.totalTokenCount ?? 0;
      }

      const latencyMs = Date.now() - startTime;
      await this.saveAiLog({
        userId: userId ?? null,
        feature: 'TALK',
        model: MODEL_NAME,
        promptTokens: totalPromptTokens || null,
        completionTokens: totalCompletionTokens || null,
        totalTokens: totalTokens || null,
        latencyMs,
        requestPayload: { messages },
        responsePayload: {
          message: finalResult.message,
          books: finalResult.books,
        },
        status: 'SUCCESS',
      });

      return {
        message: finalResult.message,
        books: finalResult.books,
      };
    } catch (error) {
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

      throw error;
    }
  }

  private async saveAiLog(data: Partial<AiRequestLog>) {
    try {
      await this.aiRequestLogRepository.save(data);
    } catch (e) {
      this.logger.error('Failed to save AI request log in SearchService:', e);
    }
  }
}
