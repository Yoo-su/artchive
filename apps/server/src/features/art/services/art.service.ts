import { ArtDetailItem, ArtItem } from '@bookjeok/core';
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XMLParser } from 'fast-xml-parser';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ArtService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * KOPIS 공연 목록 조회 (Expo 등 프록시용)
   */
  async getExternalArtList(
    query: Record<string, string | undefined>,
  ): Promise<ArtItem[]> {
    const serviceKey = this.configService.get<string>('CULTURE_SERVICE_KEY');

    if (!serviceKey) {
      throw new InternalServerErrorException(
        'KOPIS API 키가 설정되지 않았습니다.',
      );
    }

    const {
      cpage = '1',
      rows = '10',
      prfstate = '02', // DEFAULT_PRFSTATE
      startDate = '',
      endDate = '',
      genreCode = '',
      signgucode = '11', // DEFAULT_CITY_CODE
    } = query;

    const apiUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${serviceKey}&stdate=${startDate}&eddate=${endDate}&cpage=${cpage}&rows=${rows}&prfstate=${prfstate}&signgucode=${signgucode}&shcate=${genreCode}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(apiUrl, {
          responseType: 'text', // fast-xml-parser is used
        }),
      );

      const parser = new XMLParser();
      const jsonData = parser.parse(response.data) as {
        dbs?: { db?: ArtItem | ArtItem[] };
      };

      const raw = jsonData?.dbs?.db;
      if (!raw) {
        return [];
      }
      const result: ArtItem[] = Array.isArray(raw) ? raw : [raw];

      return result;
    } catch (error) {
      console.error('공연 목록 조회 실패:', error);
      throw new InternalServerErrorException('공연 목록을 가져올 수 없습니다.');
    }
  }

  /**
   * KOPIS 공연 상세 조회 (Expo 등 프록시용)
   */
  async getExternalArtDetail(artId: string): Promise<ArtDetailItem> {
    const serviceKey = this.configService.get<string>('CULTURE_SERVICE_KEY');

    if (!serviceKey) {
      throw new InternalServerErrorException(
        'KOPIS API 키가 설정되지 않았습니다.',
      );
    }

    const apiUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr/${artId}?service=${serviceKey}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(apiUrl, {
          responseType: 'text',
        }),
      );

      const parser = new XMLParser();
      const jsonData = parser.parse(response.data) as {
        dbs?: { db?: ArtDetailItem | ArtDetailItem[] };
      };

      if (!jsonData?.dbs?.db) {
        throw new NotFoundException('해당 ID의 공연 정보를 찾을 수 없습니다.');
      }

      const raw = jsonData.dbs.db;
      const detail: ArtDetailItem = Array.isArray(raw) ? raw[0] : raw;

      return detail;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('공연 상세 조회 실패:', error);
      throw new InternalServerErrorException('공연 정보를 가져올 수 없습니다.');
    }
  }
}
