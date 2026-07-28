import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry {
  vector: number[];
  expiresAt: number;
}

@Injectable()
export class EmbeddingService {
  private readonly apiKey: string;

  /** 쿼리 임베딩 캐시 (TTL 5분, 최대 500개) */
  private readonly queryCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly CACHE_MAX_SIZE = 500;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
  }

  /**
   * L2 정규화 (L2 Normalization)
   * gemini-embedding-001은 768차원(축소 차원) 사용 시 자동 정규화되지 않으므로
   * 코사인 유사도 정확도를 위해 수동 L2 정규화를 반드시 수행해야 함
   */
  normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector;
    return vector.map((v) => v / magnitude);
  }

  /**
   * 검색어(Query) 텍스트를 gemini-embedding-001 (RETRIEVAL_QUERY, 768차원)으로 임베딩 후 정규화하여 반환
   * 동일 쿼리는 5분간 캐싱하여 API 비용/레이턴시 절감
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY가 설정되지 않았습니다.',
      );
    }

    // 캐시 히트 확인
    const cached = this.queryCache.get(query);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.vector;
    }

    try {
      const endpoint =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: {
            parts: [{ text: query }],
          },
          taskType: 'RETRIEVAL_QUERY',
          outputDimensionality: 768,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini Embedding API Error Response:', errorText);
        throw new Error(
          `Gemini API HTTP Error ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();
      const rawVector: number[] = data.embedding?.values;

      if (!rawVector || !Array.isArray(rawVector)) {
        throw new Error(
          'Gemini API가 유효한 임베딩 벡터를 반환하지 않았습니다.',
        );
      }

      if (rawVector.length !== 768) {
        console.warn(
          `임베딩 벡터 차원이 768이 아닌 ${rawVector.length}입니다.`,
        );
      }

      // 필수: 768차원 정규화 수행
      const normalized = this.normalize(rawVector);

      // 캐시에 저장 (용량 초과 시 가장 오래된 항목 제거)
      if (this.queryCache.size >= this.CACHE_MAX_SIZE) {
        const oldestKey = this.queryCache.keys().next().value;
        if (oldestKey !== undefined) {
          this.queryCache.delete(oldestKey);
        }
      }
      this.queryCache.set(query, {
        vector: normalized,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return normalized;
    } catch (error) {
      console.error('Embedding Generation Failed:', error);
      throw new InternalServerErrorException(
        '검색어 임베딩 처리 중 오류가 발생했습니다.',
      );
    }
  }
}
