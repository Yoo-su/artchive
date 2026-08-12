import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { BookSearchResultDto } from '@/features/search/dtos/ai-search.dto';

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
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * pgvector match_books RPC 함수를 실행하여 유사도 상위 도서 목록 반환
   * - Supabase extensions 스키마 및 public 스키마 호환 처리
   * - RPC 호출 실패 또는 미지원 환경 시 빈 배열([]) 반환
   * @param normalizedVector - 768차원 L2 정규화된 벡터
   * @param matchCount - 반환할 도서 개수 (기본값: 10)
   */
  async searchSimilarBooks(
    normalizedVector: number[],
    matchCount = 10,
  ): Promise<BookSearchResultDto[]> {
    const vectorString = JSON.stringify(normalizedVector);

    // 1차 시도: 다양한 pgvector 함수 호출 패턴 순차 시도
    // (1) $1 (형변환 생략, PostgreSQL 인자 자동 변환)
    // (2) $1::extensions.vector (Supabase 기본 스키마)
    // (3) $1::vector (public 스키마)
    const sqlQueries = [
      `SELECT isbn, title, author, publisher, description, image, similarity FROM match_books($1, $2)`,
      `SELECT isbn, title, author, publisher, description, image, similarity FROM match_books($1::extensions.vector, $2)`,
      `SELECT isbn, title, author, publisher, description, image, similarity FROM match_books($1::vector, $2)`,
    ];

    for (const sql of sqlQueries) {
      try {
        const rawRows = await this.dataSource.query(sql, [
          vectorString,
          matchCount,
        ]);

        if (Array.isArray(rawRows)) {
          return rawRows.map((item) => {
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
        }
      } catch (err: any) {
        this.logger.debug(
          `Vector search attempt failed (${sql}): ${err?.message}`,
        );
      }
    }

    // 모든 pgvector RPC 시도가 실패한 경우
    this.logger.warn(
      'pgvector match_books RPC 함수를 실행할 수 없어 빈 도서 목록을 반환합니다.',
    );
    return [];
  }
}
