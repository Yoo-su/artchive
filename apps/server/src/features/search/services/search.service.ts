import { Injectable } from '@nestjs/common';

import { AiSearchRequestDto, AiSearchResponseDto } from '../dtos/ai-search.dto';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';
import { VectorSearchService } from './vector-search.service';

@Injectable()
export class SearchService {
  private readonly SIMILARITY_THRESHOLD = 0.35; // 최소 유사도 기준값

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
    private readonly ragService: RagService,
  ) {}

  /**
   * AI 추천 검색 (Semantic Search + RAG)
   */
  async searchAi(dto: AiSearchRequestDto): Promise<AiSearchResponseDto> {
    const trimmedQuery = dto.query.trim();

    // [안전장치 1] 모호하거나 너무 짧은 입력 검증
    if (trimmedQuery.length < 2) {
      return {
        books: [],
        explanation:
          '검색어가 너무 짧습니다. 추천받고 싶은 책의 주제나 분위기를 조금 더 구체적으로 입력해 주세요.',
      };
    }

    // 1. 질문을 768차원 L2 정규화 벡터로 생성 (gemini-embedding-001, RETRIEVAL_QUERY)
    const queryVector =
      await this.embeddingService.generateQueryEmbedding(trimmedQuery);

    // 2. Supabase pgvector match_books RPC를 호출해 유사도 상위 10권 검색
    const books = await this.vectorSearchService.searchSimilarBooks(
      queryVector,
      10,
    );

    // [안전장치 2] 유사도 최저 임계값 검증 (유사도 0.35 미만 시 연관 도서 미반환)
    const topSimilarity = books[0]?.similarity ?? 0;
    if (books.length === 0 || topSimilarity < this.SIMILARITY_THRESHOLD) {
      return {
        books: [],
        explanation:
          '입력하신 내용과 연관성이 높은 도서를 찾지 못했습니다. 원하시는 독서 분위기나 주제 키워드를 조금 더 구체적으로 작성해 보세요.',
      };
    }

    // 3. Gemini Flash를 활용해 사용자 질문 + 검색 도서를 바탕으로 RAG 추천 코멘트 생성
    const explanation = await this.ragService.generateExplanation(
      trimmedQuery,
      books,
    );

    return {
      books,
      explanation,
    };
  }
}
