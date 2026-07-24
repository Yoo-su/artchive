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
   * 멀티턴 AI 추천 대화 검색 (Multi-turn RAG Chat)
   */
  async searchAi(dto: AiSearchRequestDto): Promise<AiSearchResponseDto> {
    const { messages } = dto;

    if (!messages || messages.length === 0) {
      return {
        message: '안녕하세요! 어떤 책을 찾고 계신가요? 편안하게 말씀해 주세요.',
        books: [],
      };
    }

    // 1. 대화 의도 분석 및 쿼리 재구성 (Query Rewriting)
    const intentResult = await this.ragService.analyzeIntentAndQuery(messages);

    // 1-A. 정보가 부족하여 추가 질문이 필요한 경우
    if (!intentResult.needSearch || !intentResult.searchQuery) {
      return {
        message:
          intentResult.followUpMessage ||
          '어떤 분위기나 감성의 책을 찾으시는지 조금만 더 이야기해 주시겠어요?',
        books: [],
      };
    }

    // 2. 필요 시 768차원 질문 벡터 생성 및 pgvector match_books 검색
    const queryVector = await this.embeddingService.generateQueryEmbedding(
      intentResult.searchQuery,
    );

    const books = await this.vectorSearchService.searchSimilarBooks(
      queryVector,
      10,
    );

    // 2-A. 유사도가 기준치 미달인 경우
    const topSimilarity = books[0]?.similarity ?? 0;
    if (books.length === 0 || topSimilarity < this.SIMILARITY_THRESHOLD) {
      return {
        message:
          '말씀하신 상황과 딱 어울리는 도서를 찾지 못했습니다. 원하시는 분위기나 관심 장르를 다르게 말씀해 주시겠어요?',
        books: [],
      };
    }

    // 3. 검색된 책 + 대화 히스토리 기반 최종 AI 추천 답변 생성
    const message = await this.ragService.generateChatRecommendationMessage(
      messages,
      books,
    );

    return {
      message,
      books,
    };
  }
}
