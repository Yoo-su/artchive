import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { BookSearchResultDto } from '../dtos/ai-search.dto';

interface MatchBooksRow {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
  image: string;
  similarity: number | string;
}

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

      const rawRows = await this.dataSource.query(
        `SELECT isbn, title, author, publisher, description, image, similarity
         FROM match_books($1::vector, $2)`,
        [vectorString, matchCount],
      );

      const results: BookSearchResultDto[] = rawRows.map((item) => {
        const row = item as MatchBooksRow;
        return {
          isbn: row.isbn,
          title: row.title,
          author: row.author,
          publisher: row.publisher,
          description: row.description,
          image: row.image,
          similarity:
            typeof row.similarity === 'number'
              ? row.similarity
              : parseFloat(row.similarity ?? '0'),
        };
      });

      return results;
    } catch (error) {
      console.error('Vector Search RPC Failed:', error);
      throw new InternalServerErrorException(
        '유사 도서 벡터 검색 중 오류가 발생했습니다.',
      );
    }
  }
}
