import { BookSearchResultDto } from '../dtos/ai-search.dto';
import { deduplicateBooks, normalizeBookTitle } from './book-deduplicator.util';

describe('BookDeduplicatorUtil', () => {
  describe('normalizeBookTitle', () => {
    it('should strip volume parentheses and numbers', () => {
      expect(normalizeBookTitle('죄와 벌 (상)')).toBe('죄와 벌');
      expect(normalizeBookTitle('죄와 벌 [하]')).toBe('죄와 벌');
      expect(normalizeBookTitle('카라마조프 가의 형제들 1권')).toBe(
        '카라마조프 가의 형제들',
      );
      expect(normalizeBookTitle('백치 2')).toBe('백치');
      expect(normalizeBookTitle('토지 (세트)')).toBe('토지');
    });

    it('should preserve base title without volume markers', () => {
      expect(normalizeBookTitle('어린 왕자')).toBe('어린 왕자');
      expect(normalizeBookTitle('데미안')).toBe('데미안');
    });
  });

  describe('deduplicateBooks', () => {
    const mockBooks: BookSearchResultDto[] = [
      {
        isbn: '1',
        title: '죄와 벌 1',
        author: '표도르 도스토옙스키',
        publisher: '민음사',
        description: '라스콜니코프의 살인과 고뇌',
        image: 'https://example.com/1.jpg',
        similarity: 0.9,
      },
      {
        isbn: '2',
        title: '죄와 벌 2',
        author: '표도르 도스토옙스키',
        publisher: '민음사',
        description: '라스콜니코프의 구원',
        image: 'https://example.com/2.jpg',
        similarity: 0.88,
      },
      {
        isbn: '3',
        title: '카라마조프 가의 형제들 1',
        author: '표도르 도스토옙스키',
        publisher: '열린책들',
        description: '표도르 파블로비치와 세 아들',
        image: 'https://example.com/3.jpg',
        similarity: 0.85,
      },
      {
        isbn: '4',
        title: '용의자 X의 헌신',
        author: '히가시노 게이고',
        publisher: '재인',
        description: '천재 수학자의 완벽한 알리바이',
        image: 'https://example.com/4.jpg',
        similarity: 0.82,
      },
    ];

    it('should deduplicate multiple volumes of the same work', () => {
      const result = deduplicateBooks(mockBooks);
      const titles = result.map((b) => b.title);
      expect(titles).toContain('죄와 벌 1');
      expect(titles).not.toContain('죄와 벌 2');
      expect(result.length).toBe(3);
    });

    it('should filter out books matching excluded keywords', () => {
      const result = deduplicateBooks(mockBooks, undefined, [
        '히가시노 게이고',
      ]);
      expect(result.some((b) => b.author === '히가시노 게이고')).toBe(false);
      expect(result.length).toBe(2);
    });

    it('should prioritize preferred publishers', () => {
      const booksWithMultiPublishers: BookSearchResultDto[] = [
        {
          isbn: '10',
          title: '이방인',
          author: '알베르 카뮈',
          publisher: '다른출판사',
          description: '오늘 엄마가 죽었다',
          image: 'https://example.com/10.jpg',
          similarity: 0.95,
        },
        {
          isbn: '11',
          title: '이방인',
          author: '알베르 카뮈',
          publisher: '민음사',
          description: '오늘 엄마가 죽었다',
          image: 'https://example.com/11.jpg',
          similarity: 0.85,
        },
      ];

      const result = deduplicateBooks(booksWithMultiPublishers, ['민음사']);
      expect(result.length).toBe(1);
      expect(result[0].publisher).toBe('민음사');
    });
  });
});
