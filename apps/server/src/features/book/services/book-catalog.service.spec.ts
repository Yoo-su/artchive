import { Test, TestingModule } from '@nestjs/testing';

import { BOOK_CATALOG_PROVIDERS } from '../providers/book-catalog.types';
import { BookCatalogService } from './book-catalog.service';

const book = (isbn: string) => ({
  isbn,
  title: 't',
  author: 'a',
  publisher: 'p',
  description: 'd',
  image: 'i',
  discount: '0',
});

/** 목의 메서드를 `jest.Mock` 속성으로 잡아야 unbound-method 규칙에 걸리지 않는다. */
interface MockProvider {
  name: string;
  search: jest.Mock;
  findByIsbn: jest.Mock;
}

const makeProvider = (name: string): MockProvider => ({
  name,
  search: jest.fn(),
  findByIsbn: jest.fn(),
});

describe('BookCatalogService', () => {
  let service: BookCatalogService;
  let primary: MockProvider;
  let fallback: MockProvider;

  beforeEach(async () => {
    primary = makeProvider('primary');
    fallback = makeProvider('fallback');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookCatalogService,
        { provide: BOOK_CATALOG_PROVIDERS, useValue: [primary, fallback] },
      ],
    }).compile();

    service = module.get(BookCatalogService);
  });

  describe('search', () => {
    it('앞선 공급처가 결과를 주면 뒤는 호출하지 않는다', async () => {
      primary.search.mockResolvedValue({
        total: 1,
        start: 1,
        display: 10,
        items: [book('1')],
      });

      const result = await service.search({ query: '데미안' });

      expect(result.items).toHaveLength(1);
      expect(fallback.search).not.toHaveBeenCalled();
    });

    it('앞선 공급처가 던지면 다음 공급처로 넘어간다', async () => {
      primary.search.mockRejectedValue(new Error('공급처 장애'));
      fallback.search.mockResolvedValue({
        total: 1,
        start: 1,
        display: 10,
        items: [book('2')],
      });

      const result = await service.search({ query: '데미안' });

      expect(result.items[0].isbn).toBe('2');
    });

    it('모든 공급처가 던지면 예외를 전파한다', async () => {
      primary.search.mockRejectedValue(new Error('1번 장애'));
      fallback.search.mockRejectedValue(new Error('2번 장애'));

      await expect(service.search({ query: '데미안' })).rejects.toThrow(
        '2번 장애',
      );
    });

    it('정상 응답이 하나라도 있으면 결과가 비어도 예외로 만들지 않는다', async () => {
      // 장애를 "책 없음"으로 둔갑시키지 않되, 그 반대도 하지 않아야 한다.
      primary.search.mockResolvedValue({
        total: 0,
        start: 1,
        display: 10,
        items: [],
      });
      fallback.search.mockRejectedValue(new Error('뒤쪽 장애'));

      const result = await service.search({ query: '없는책' });

      expect(result.items).toEqual([]);
    });

    it('누락된 파라미터를 기본값으로 채워 공급처에 넘긴다', async () => {
      primary.search.mockResolvedValue({
        total: 0,
        start: 1,
        display: 10,
        items: [book('3')],
      });

      await service.search({ query: '데미안' });

      expect(primary.search).toHaveBeenCalledWith({
        query: '데미안',
        display: 10,
        start: 1,
        sort: 'sim',
        field: 'Keyword',
      });
    });
  });

  describe('findByIsbn', () => {
    it('앞선 공급처가 못 찾으면 다음 공급처에서 찾는다', async () => {
      primary.findByIsbn.mockResolvedValue(null);
      fallback.findByIsbn.mockResolvedValue(book('9788932925554'));

      const result = await service.findByIsbn('9788932925554');

      expect(result?.isbn).toBe('9788932925554');
    });

    it('아무도 못 찾으면 null을 반환한다', async () => {
      primary.findByIsbn.mockResolvedValue(null);
      fallback.findByIsbn.mockResolvedValue(null);

      await expect(service.findByIsbn('없음')).resolves.toBeNull();
    });
  });
});
