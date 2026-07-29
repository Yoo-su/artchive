import {
  cleanHtmlText,
  extractAladinDetailedDescription,
  formatAladinCoverImage,
} from '@bookjeok/core';
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

import { Book } from '../entities/book.entity';

export interface AladinBookItem {
  title: string;
  link: string;
  author: string;
  pubDate: string;
  description: string;
  fullDescription?: string;
  fullDescription2?: string;
  isbn: string;
  isbn13: string;
  itemId: number;
  priceSales?: number;
  priceStandard?: number;
  cover: string;
  publisher: string;
  customerReviewRank?: number;
}

export interface AladinApiResponse {
  title: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  pubDate: string;
  item?: AladinBookItem[];
}

@Injectable()
export class AladinBookSearchService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getTtbKey(): string {
    const ttbKey = this.configService.get<string>('ALADIN_TTB_KEY');
    if (!ttbKey) {
      throw new InternalServerErrorException(
        '알라딘 API TTBKey 설정(ALADIN_TTB_KEY)이 올바르지 않습니다.',
      );
    }
    return ttbKey;
  }

  /**
   * 알라딘 도서 검색 API(ItemSearch.aspx)를 호출하여 도서 목록을 반환합니다.
   * @param query 검색어
   * @param display 출력 건수 (기본 10)
   * @param start 시작 위치/페이지
   * @param sort 정렬 옵션 (sim: 정확도순, date: 출간일순)
   */
  async search(
    query: string,
    display: number = 10,
    start: number = 1,
    sort: string = 'sim',
  ): Promise<Partial<Book>[]> {
    const ttbKey = this.getTtbKey();
    const sortParam = sort === 'date' ? 'PublishTime' : 'Accuracy';
    const pageStart = Math.floor((start - 1) / Math.max(display, 1)) + 1;

    try {
      const response = await lastValueFrom(
        this.httpService.get<AladinApiResponse>(
          'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx',
          {
            params: {
              ttbkey: ttbKey,
              Query: query,
              QueryType: 'Keyword',
              SearchTarget: 'Book',
              MaxResults: display,
              Start: pageStart,
              Sort: sortParam,
              Output: 'js',
              Version: '20131101',
              Cover: 'Big',
              OptResult: 'fulldescription',
            },
          },
        ),
      );

      const items: AladinBookItem[] = response.data?.item || [];

      return items.map((item) => ({
        title: cleanHtmlText(item.title),
        author: cleanHtmlText(item.author),
        publisher: cleanHtmlText(item.publisher),
        description: extractAladinDetailedDescription(item),
        image: formatAladinCoverImage(item.cover),
        isbn: item.isbn13 || item.isbn,
        discount: String(item.priceSales || item.priceStandard || ''),
      }));
    } catch (error) {
      console.error('알라딘 도서 검색 API 호출 실패:', error);
      throw new InternalServerErrorException(
        '도서 정보를 검색하는 도중 오류가 발생했습니다.',
      );
    }
  }

  /**
   * 알라딘 도서 상세 API(ItemLookUp.aspx)를 호출하여 단건 도서를 상세 반환합니다.
   */
  async searchDetail(isbn: string): Promise<Partial<Book> | null> {
    const ttbKey = this.getTtbKey();
    const itemIdType = isbn.length === 13 ? 'ISBN13' : 'ISBN';

    try {
      const response = await lastValueFrom(
        this.httpService.get<AladinApiResponse>(
          'https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx',
          {
            params: {
              ttbkey: ttbKey,
              ItemId: isbn,
              ItemIdType: itemIdType,
              Output: 'js',
              Version: '20131101',
              Cover: 'Big',
              OptResult: 'fulldescription',
            },
          },
        ),
      );

      const items: AladinBookItem[] = response.data?.item || [];
      if (items.length === 0) return null;

      const item = items[0];
      return {
        title: cleanHtmlText(item.title),
        author: cleanHtmlText(item.author),
        publisher: cleanHtmlText(item.publisher),
        description: extractAladinDetailedDescription(item),
        image: formatAladinCoverImage(item.cover),
        isbn: item.isbn13 || item.isbn,
        discount: String(item.priceSales || item.priceStandard || ''),
      };
    } catch (error) {
      console.error('알라딘 도서 상세 API 호출 실패:', error);
      throw new InternalServerErrorException(
        '도서 상세 정보를 가져오는 데 실패했습니다.',
      );
    }
  }

  /**
   * 알라딘 검색 API를 호출하여 raw 응답을 반환합니다. (Expo 등 외부 프록시용)
   */
  async searchRaw(
    query: string,
    display: number = 10,
    start: number = 1,
    sort: string = 'sim',
  ): Promise<Record<string, unknown>> {
    const ttbKey = this.getTtbKey();
    const sortParam = sort === 'date' ? 'PublishTime' : 'Accuracy';
    const pageStart = Math.floor((start - 1) / Math.max(display, 1)) + 1;

    try {
      const response = await lastValueFrom(
        this.httpService.get<AladinApiResponse>(
          'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx',
          {
            params: {
              ttbkey: ttbKey,
              Query: query,
              QueryType: 'Keyword',
              SearchTarget: 'Book',
              MaxResults: display,
              Start: pageStart,
              Sort: sortParam,
              Output: 'js',
              Version: '20131101',
              Cover: 'Big',
              OptResult: 'fulldescription',
            },
          },
        ),
      );

      const data = response.data;
      if (data && Array.isArray(data.item)) {
        data.item = data.item.map((item) => ({
          ...item,
          cover: formatAladinCoverImage(item.cover),
        }));
      }

      return data as unknown as Record<string, unknown>;
    } catch (error) {
      console.error('알라딘 검색 API 호출 실패(raw):', error);
      throw new InternalServerErrorException(
        '도서 정보를 가져오는 데 실패했습니다.',
      );
    }
  }

  /**
   * 알라딘 상세검색 API를 호출하여 raw 응답을 반환합니다. (Expo 등 외부 프록시용)
   */
  async searchDetailRaw(isbn: string): Promise<Record<string, unknown>> {
    const ttbKey = this.getTtbKey();
    const itemIdType = isbn.length === 13 ? 'ISBN13' : 'ISBN';

    try {
      const response = await lastValueFrom(
        this.httpService.get<AladinApiResponse>(
          'https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx',
          {
            params: {
              ttbkey: ttbKey,
              ItemId: isbn,
              ItemIdType: itemIdType,
              Output: 'js',
              Version: '20131101',
              Cover: 'Big',
              OptResult: 'fulldescription',
            },
          },
        ),
      );

      const data = response.data;
      if (data && Array.isArray(data.item)) {
        data.item = data.item.map((item) => ({
          ...item,
          cover: formatAladinCoverImage(item.cover),
        }));
      }

      return data as unknown as Record<string, unknown>;
    } catch (error) {
      console.error('알라딘 도서 상세 API 호출 실패(raw):', error);
      throw new InternalServerErrorException(
        '도서 상세 정보를 가져오는 데 실패했습니다.',
      );
    }
  }
}
