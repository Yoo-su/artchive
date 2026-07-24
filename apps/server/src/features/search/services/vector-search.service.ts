import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { BookSearchResultDto } from '../dtos/ai-search.dto';

@Injectable()
export class VectorSearchService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * pgvector match_books RPC 함수를 실행하여 유사도 상위 도서 목록 반환
   * @param normalizedVector - 768차원 L2 정규화된 벡터
   * @param matchCount - 반환할 도서 개수 (기본값: 10)
   */
  async searchSimilarBooks(
    normalizedVector: number[],
    matchCount = 10,
  ): Promise<BookSearchResultDto[]> {
    try {
      const vectorString = JSON.stringify(normalizedVector);

      const rows = await this.dataSource.query(
        `SELECT isbn, title, author, publisher, description, image, similarity
         FROM match_books($1::vector, $2)`,
        [vectorString, matchCount],
      );

      return rows.map((row: any) => ({
        isbn: row.isbn,
        title: row.title,
        author: row.author,
        publisher: row.publisher,
        description: row.description,
        image: row.image,
        similarity: parseFloat(row.similarity ?? '0'),
      }));
    } catch (error) {
      console.error('Vector Search RPC Failed:', error);
      throw new InternalServerErrorException(
        '유사 도서 벡터 검색 중 오류가 발생했습니다.',
      );
    }
  }
}
