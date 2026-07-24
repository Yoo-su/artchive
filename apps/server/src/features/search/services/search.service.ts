import { Injectable } from '@nestjs/common';

import {
  AiSearchRequestDto,
  AiSearchResponseDto,
} from '@/features/search/dtos/ai-search.dto';
import { EmbeddingService } from '@/features/search/services/embedding.service';
import { RagService } from '@/features/search/services/rag.service';
import { VectorSearchService } from '@/features/search/services/vector-search.service';

@Injectable()
export class SearchService {
  private readonly SIMILARITY_THRESHOLD = 0.35; // 최소 유사도 기준값
  private readonly CANDIDATE_POOL_SIZE = 25; // pgvector에서 뽑아올 후보 풀 크기 (LLM이 그중에서 선별)

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Conversational Agent RAG Pipeline (속도 고속 최적화 버전)
   */
  async searchAi(dto: AiSearchRequestDto): Promise<AiSearchResponseDto> {
    const { messages } = dto;

    if (!messages || messages.length === 0) {
      return {
        message: '안녕하세요! 어떤 책을 찾고 계신가요? 편안하게 말씀해 주세요.',
        books: [],
      };
    }

    // 1. Gemini Conversational Turn 처리 (1차 LLM 호출: 자연스러운 대화 및 search_books 도구 호출 여부 동적 판단)
    const turnResult =
      await this.ragService.processConversationalTurn(messages);

    // 1-A. AI가 대화/질문만 진행하기로 한 경우 (search_books 도구를 호출하지 않음 - 초고속 반환)
    if (!turnResult.searchQueryRequested) {
      return {
        message: turnResult.message,
        books: [],
      };
    }

    // 2. AI가 search_books 도구를 호출한 경우: 768차원 질문 벡터 생성 및 pgvector 검색
    //    후보 풀을 넉넉히(25권) 뽑아서, LLM이 그중 진짜 좋은 것만 골라내게 함
    const queryVector = await this.embeddingService.generateQueryEmbedding(
      turnResult.searchQueryRequested,
    );

    const rawBooks = await this.vectorSearchService.searchSimilarBooks(
      queryVector,
      this.CANDIDATE_POOL_SIZE,
    );

    // 2-A. 유사도 최저 임계값 미달 처리
    // 수정: 예전엔 1등 책의 유사도만 검사해서, 나머지 낮은 유사도 책들이
    // 필터링 없이 그대로 LLM에게 넘어가 "잡다한 추천"의 원인이 됐음.
    // 전체 후보를 임계값으로 걸러낸 뒤, 그 결과가 비어있을 때만 "없음" 처리하도록 수정.
    const filteredBooks = rawBooks.filter(
      (b) => b.similarity >= this.SIMILARITY_THRESHOLD,
    );

    if (filteredBooks.length === 0) {
      return {
        message:
          '말씀하신 상황과 어울리는 도서를 데이터베이스에서 찾지 못했습니다. 원하시는 분위기나 관심 장르를 다르게 말씀해 주시겠어요?',
        books: [],
      };
    }

    // 3. 통합 RAG Reranking & Synthesis (2차 LLM 호출)
    //    filteredBooks(유사도 통과한 것만)를 넘겨서, LLM이 다시 한번 맥락 기준으로 정제
    const finalResult = await this.ragService.filterAndSynthesizeRecommendation(
      messages,
      filteredBooks,
    );

    return {
      message: finalResult.message,
      books: finalResult.books,
    };
  }
}
