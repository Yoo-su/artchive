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

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Conversational Agent RAG Pipeline
   */
  async searchAi(dto: AiSearchRequestDto): Promise<AiSearchResponseDto> {
    const { messages } = dto;

    if (!messages || messages.length === 0) {
      return {
        message: '안녕하세요! 어떤 책을 찾고 계신가요? 편안하게 말씀해 주세요.',
        books: [],
      };
    }

    // 1. Gemini Conversational Turn 처리 (자연스러운 대화 및 search_books 도구 호출 여부 동적 판단)
    const turnResult =
      await this.ragService.processConversationalTurn(messages);

    // 1-A. AI가 대화/질문만 진행하기로 한 경우 (search_books 도구를 호출하지 않음)
    if (!turnResult.searchQueryRequested) {
      return {
        message: turnResult.message,
        books: [],
      };
    }

    // 2. AI가 search_books 도구를 호출한 경우: 768차원 질문 벡터 생성 및 pgvector 검색 (상위 15권)
    const queryVector = await this.embeddingService.generateQueryEmbedding(
      turnResult.searchQueryRequested,
    );

    const rawBooks = await this.vectorSearchService.searchSimilarBooks(
      queryVector,
      15,
    );

    // 2-A. 유사도 최저 임계값 미달 처리
    const topSimilarity = rawBooks[0]?.similarity ?? 0;
    if (rawBooks.length === 0 || topSimilarity < this.SIMILARITY_THRESHOLD) {
      return {
        message:
          '말씀하신 상황과 어울리는 도서를 데이터베이스에서 찾지 못했습니다. 원하시는 분위기나 관심 장르를 다르게 말씀해 주시겠어요?',
        books: [],
      };
    }

    // 3. RAG Reranker: 타겟 독자층/장르/깊이 검증하여 부적합 도서 제거
    const filteredBooks = await this.ragService.filterAndRerankBooks(
      messages,
      rawBooks,
    );

    // 3-A. 적합한 도서가 0권인 경우 솔직하게 안내
    if (filteredBooks.length === 0) {
      return {
        message: `요청하신 "${turnResult.searchQueryRequested}" 조건에 진정으로 부합하는 적합한 도서를 데이터베이스에서 발굴하지 못했습니다. 다른 장르나 키워드로 말씀해 주시면 다시 찾아드릴게요.`,
        books: [],
      };
    }

    // 4. 최종 RAG 합성: 추천 총평 서두 및 개별 도서별 추천 사유(reason) 반환
    const finalResult = await this.ragService.synthesizeFinalRecommendation(
      messages,
      filteredBooks,
    );

    return {
      message: finalResult.message,
      books: finalResult.books,
    };
  }
}
