import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Book } from '../entities/book.entity';

interface NaverBookItem {
  title: string;
  link: string;
  image: string;
  author: string;
  discount: string;
  publisher: string;
  isbn: string;
  description: string;
  pubdate: string;
}

@Injectable()
export class NaverBookSearchService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 네이버 책 검색 API를 호출하여 책 목록을 반환합니다.
   * @param query 검색어
   * @param display 출력 건수 (기본 10)
   * @param start 시작 위치 (기본 1)
   * @param sort 정렬 옵션 (sim: 정확도순, date: 출간일순, count: 판매량순)
   */
  async search(
    query: string,
    display: number = 10,
    start: number = 1,
    sort: string = 'sim',
  ): Promise<Partial<Book>[]> {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NAVER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        '네이버 API 설정이 올바르지 않습니다.',
      );
    }

    try {
      const response = await lastValueFrom(
        this.httpService.get('https://openapi.naver.com/v1/search/book.json', {
          params: { query, display, start, sort },
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
          },
        }),
      );

      const items: NaverBookItem[] = response.data.items;

      // 네이버 API 결과를 Book 엔티티 구조와 호환되도록 매핑
      return items.map((item) => ({
        title: item.title,
        author: item.author,
        publisher: item.publisher,
        description: item.description,
        image: item.image,
        isbn: item.isbn,
        pubdate: item.pubdate,
      }));
    } catch (error) {
      console.error('네이버 책 검색 API 호출 실패:', error);
      throw new InternalServerErrorException(
        '책 정보를 검색하는 도중 오류가 발생했습니다.',
      );
    }
  }
}
