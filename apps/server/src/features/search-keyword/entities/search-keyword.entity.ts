import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 검색어 통계 엔티티
 * - 도서 검색 시 검색어를 수집하여 인기 검색어를 제공하기 위한 테이블
 * - keyword는 정규화된 상태로 저장됨 (초성 제거, 공백 정리 등)
 */
@Entity({ name: 'search_keywords' })
export class SearchKeyword {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  /** 정규화된 검색어 (UNIQUE) */
  @Column({ unique: true, length: 100 })
  keyword: string;

  /** 누적 검색 횟수 */
  @Column({ type: 'bigint', default: 0 })
  searchCount: number;

  /** 최근 검색 시각 (인기 검색어 조회 시 최근 N일 기준 필터링용) */
  @Column({ type: 'timestamptz' })
  lastSearchedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
