import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingService {
  private readonly apiKey: string;

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
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY가 설정되지 않았습니다.',
      );
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${this.apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      return this.normalize(rawVector);
    } catch (error) {
      console.error('Embedding Generation Failed:', error);
      throw new InternalServerErrorException(
        '검색어 임베딩 처리 중 오류가 발생했습니다.',
      );
    }
  }
}
