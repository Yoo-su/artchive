import {
  escapeLike,
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
});
