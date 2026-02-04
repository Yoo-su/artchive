import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { SearchKeyword } from '../entities/search-keyword.entity';
import { normalizeKeyword } from '../utils/normalize-keyword.util';

/**
 * 인기 검색어 서비스
 * - 검색어 기록 및 인기 검색어 조회 담당
 */
@Injectable()
export class SearchKeywordService {
  constructor(
    @InjectRepository(SearchKeyword)
    private readonly searchKeywordRepository: Repository<SearchKeyword>,
  ) {}

  /**
   * 검색어를 기록합니다. (upsert 방식)
   * - 정규화된 검색어가 이미 존재하면 searchCount 증가 및 lastSearchedAt 업데이트
   * - 존재하지 않으면 새로 생성
   * @param rawKeyword 원본 검색어
   */
  async recordSearchKeyword(rawKeyword: string): Promise<void> {
    const normalized = normalizeKeyword(rawKeyword);

    // 정규화 결과가 null이면 무시 (2글자 미만, 초성만 등)
    if (!normalized) {
      return;
    }

    // PostgreSQL 네이티브 upsert 쿼리 사용
    // INSERT ON CONFLICT DO UPDATE로 원자적 처리
    // TypeORM은 기본적으로 camelCase 컬럼명을 그대로 사용
    await this.searchKeywordRepository.query(
      `
      INSERT INTO search_keywords (keyword, "searchCount", "lastSearchedAt", "createdAt", "updatedAt")
      VALUES ($1, 1, NOW(), NOW(), NOW())
      ON CONFLICT (keyword) DO UPDATE SET
        "searchCount" = search_keywords."searchCount" + 1,
        "lastSearchedAt" = NOW(),
        "updatedAt" = NOW()
      `,
      [normalized],
    );
  }

  /**
   * 인기 검색어를 조회합니다.
   * 최근 3일 이내에 검색된 키워드 중 검색 횟수가 높은 순으로 반환합니다.
   * @param limit 반환할 최대 개수 (기본값: 10)
   * @returns 인기 검색어 목록
   */
  async findPopularKeywords(
    limit = 10,
  ): Promise<{ keyword: string; searchCount: number }[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const keywords = await this.searchKeywordRepository.find({
      where: {
        lastSearchedAt: MoreThanOrEqual(threeDaysAgo),
        searchCount: MoreThanOrEqual(3),
      },
      order: {
        searchCount: 'DESC',
        lastSearchedAt: 'DESC',
      },
      take: limit,
    });

    return keywords.map((k) => ({
      keyword: k.keyword,
      searchCount: Number(k.searchCount),
    }));
  }
}
