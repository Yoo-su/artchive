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
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * KOPIS 공연/예술 목록 조회 (Expo 등 프록시용)
   */
  async getExternalArtList(
    query: Record<string, string | undefined>,
  ): Promise<Record<string, unknown>> {
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
      const jsonData = parser.parse(response.data);

      const result = jsonData?.dbs?.db ?? [];

      return result as Record<string, unknown>;
    } catch (error) {
      console.error('공연 목록 조회 실패:', error);
      throw new InternalServerErrorException('공연 목록을 가져올 수 없습니다.');
    }
  }

  /**
   * KOPIS 공연 상세 조회 (Expo 등 프록시용)
   */
  async getExternalArtDetail(artId: string): Promise<Record<string, unknown>> {
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
      const jsonData = parser.parse(response.data);

      if (!jsonData?.dbs?.db) {
        throw new NotFoundException('해당 ID의 공연 정보를 찾을 수 없습니다.');
      }

      return jsonData.dbs.db as Record<string, unknown>;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('공연 상세 조회 실패:', error);
      throw new InternalServerErrorException('공연 정보를 가져올 수 없습니다.');
    }
  }
}
