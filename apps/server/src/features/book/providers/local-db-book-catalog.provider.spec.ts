import { Repository } from 'typeorm';

import { Book } from '../entities/book.entity';
import {
  escapeLike,
  LocalDbBookCatalogProvider,
  relevanceCaseSql,
  searchColumnsFor,
} from './local-db-book-catalog.provider';

describe('LocalDbBookCatalogProvider 검색 규칙', () => {
  describe('searchColumnsFor', () => {
    /** field를 무시하면 도서 상세의 같은 출판사 책과 홈 출판사 슬라이더가 0건이 된다. */
    it('Publisher 검색은 publisher 컬럼을 본다', () => {
      expect(searchColumnsFor('Publisher')).toEqual(['publisher']);
    });

    it('Title / Author는 해당 컬럼만 본다', () => {
      expect(searchColumnsFor('Title')).toEqual(['title']);
      expect(searchColumnsFor('Author')).toEqual(['author']);
    });

    it('Keyword는 세 컬럼을 통합해서 본다', () => {
      expect(searchColumnsFor('Keyword')).toEqual([
        'title',
        'author',
        'publisher',
      ]);
    });

    it('모르는 값은 통합 검색으로 떨어뜨린다', () => {
      expect(
        searchColumnsFor('Unknown' as Parameters<typeof searchColumnsFor>[0]),
      ).toEqual(['title', 'author', 'publisher']);
    });
  });

  describe('escapeLike', () => {
    /** 이스케이프하지 않으면 "50%"가 "50으로 시작하는 모든 것"이 된다. */
    it('와일드카드 문자를 무력화한다', () => {
      expect(escapeLike('50%')).toBe('50\\%');
      expect(escapeLike('a_b')).toBe('a\\_b');
      expect(escapeLike('back\\slash')).toBe('back\\\\slash');
    });

    it('평범한 검색어는 그대로 둔다', () => {
      expect(escapeLike('채식주의자')).toBe('채식주의자');
    });
  });

  describe('relevanceCaseSql', () => {
    it('완전일치 → 접두일치 → 부분일치 순으로 순위를 매긴다', () => {
      const sql = relevanceCaseSql('book', ['title']);

      expect(sql).toBe(
        'CASE ' +
          'WHEN book.title ILIKE :exact THEN 0 ' +
          'WHEN book.title ILIKE :prefix THEN 1 ' +
          'WHEN book.title ILIKE :like THEN 2 ' +
          'ELSE 3 END',
      );
    });

    /** 통합 검색에서는 제목 부분일치가 저자 완전일치보다 앞선다. */
    it('컬럼 우선순위가 계단으로 이어진다', () => {
      const sql = relevanceCaseSql('book', ['title', 'author', 'publisher']);

      expect(sql).toContain('WHEN book.title ILIKE :exact THEN 0');
      expect(sql).toContain('WHEN book.author ILIKE :exact THEN 3');
      expect(sql).toContain('WHEN book.publisher ILIKE :exact THEN 6');
      expect(sql).toContain('ELSE 9 END');
    });

    it('테이블 별칭을 그대로 반영한다', () => {
      expect(relevanceCaseSql('b', ['title'])).toContain('b.title');
    });
  });

  describe('정렬 순서', () => {
    /**
     * 흔한 키워드는 대부분 하나의 관련도 버킷에 뭉치므로(운영 실측: "사랑" 제목
     * 부분일치만 791건) 두 번째 정렬 키가 사실상 체감 순서를 결정합니다.
     * 전에 쓰던 viewCount는 도서의 75%가 0이고 나머지도 크롤러 흔적이라
     * 스테디셀러가 오히려 바닥에 깔렸습니다. 그 회귀를 막습니다.
     */
    function searchWithSpy() {
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      const repo = {
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      } as unknown as Repository<Book>;

      return { qb, provider: new LocalDbBookCatalogProvider(repo) };
    }

    it('관련도 다음은 판매지수로 가른다', async () => {
      const { qb, provider } = searchWithSpy();

      await provider.search({
        query: '사랑',
        display: 10,
        start: 1,
        field: 'Keyword',
        sort: 'sim',
      });

      expect(qb.addOrderBy).toHaveBeenNthCalledWith(
        1,
        'book.salesPoint',
        'DESC',
        'NULLS LAST',
      );
    });

    it('viewCount로는 정렬하지 않는다', async () => {
      const { qb, provider } = searchWithSpy();

      await provider.search({
        query: '사랑',
        display: 10,
        start: 1,
        field: 'Keyword',
        sort: 'sim',
      });

      const keys = [
        ...qb.orderBy.mock.calls.flat(),
        ...qb.addOrderBy.mock.calls.flat(),
      ];
      expect(keys).not.toContain('book.viewCount');
    });

    it('sort="date"일 때는 출간일(pubDate) 최신순으로 정렬한다', async () => {
      const { qb, provider } = searchWithSpy();

      await provider.search({
        query: '사랑',
        display: 10,
        start: 1,
        field: 'Keyword',
        sort: 'date',
      });

      expect(qb.orderBy).toHaveBeenCalledWith(
        'book.pubDate',
        'DESC',
        'NULLS LAST',
      );
      expect(qb.addOrderBy).toHaveBeenNthCalledWith(
        1,
        'book.salesPoint',
        'DESC',
        'NULLS LAST',
      );
      expect(qb.addOrderBy).toHaveBeenNthCalledWith(2, 'book.isbn', 'ASC');
    });

    /** 정렬이 흔들리면 OFFSET 페이지네이션에서 중복과 누락이 생긴다. */
    it('isbn으로 순서를 확정한다', async () => {
      const { qb, provider } = searchWithSpy();

      await provider.search({
        query: '사랑',
        display: 10,
        start: 1,
        field: 'Keyword',
        sort: 'sim',
      });

      expect(qb.addOrderBy).toHaveBeenLastCalledWith('book.isbn', 'ASC');
    });

    it('공백뿐인 검색어는 질의하지 않는다', async () => {
      const { qb, provider } = searchWithSpy();

      const result = await provider.search({
        query: '   ',
        display: 10,
        start: 1,
        field: 'Keyword',
        sort: 'sim',
      });

      expect(result.total).toBe(0);
      expect(qb.getManyAndCount).not.toHaveBeenCalled();
    });
  });
});
