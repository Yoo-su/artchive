import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';

export interface DeliveryTrackingProgress {
  time: string;
  status: {
    id: string;
    text: string;
  };
  location?: {
    name: string;
  };
  description?: string;
}

export interface DeliveryTrackingInfo {
  carrier: {
    id: string;
    name: string;
  };
  from?: {
    name: string;
    time?: string;
  };
  to?: {
    name: string;
    time?: string;
  };
  state: {
    id: string;
    text: string;
  };
  progresses: DeliveryTrackingProgress[];
}

const CARRIER_MAP: Record<string, string> = {
  // CJ대한통운
  cj대한통운: 'kr.cjlogistics',
  cj: 'kr.cjlogistics',
  '04': 'kr.cjlogistics',
  'kr.cjlogistics': 'kr.cjlogistics',
  // 롯데택배
  롯데택배: 'kr.lotte',
  롯데: 'kr.lotte',
  lotte: 'kr.lotte',
  '08': 'kr.lotte',
  'kr.lotte': 'kr.lotte',
  // 한진택배
  한진택배: 'kr.hanjin',
  한진: 'kr.hanjin',
  hanjin: 'kr.hanjin',
  '05': 'kr.hanjin',
  'kr.hanjin': 'kr.hanjin',
  // 로젠택배
  로젠택배: 'kr.logen',
  로젠: 'kr.logen',
  logen: 'kr.logen',
  '06': 'kr.logen',
  'kr.logen': 'kr.logen',
  // 우체국택배
  우체국택배: 'kr.epost',
  우체국: 'kr.epost',
  epost: 'kr.epost',
  '01': 'kr.epost',
  'kr.epost': 'kr.epost',
  // CU 편의점택배
  'cu 편의점택배': 'kr.cupost',
  cu택배: 'kr.cupost',
  cu: 'kr.cupost',
  cupost: 'kr.cupost',
  'kr.cupost': 'kr.cupost',
  // GS Postbox
  'gs postbox': 'kr.cvsnet',
  gs편의점택배: 'kr.cvsnet',
  gs택배: 'kr.cvsnet',
  gs: 'kr.cvsnet',
  cvsnet: 'kr.cvsnet',
  'kr.cvsnet': 'kr.cvsnet',
};

@Injectable()
export class DeliveryTrackerService {
  private readonly logger = new Logger(DeliveryTrackerService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('DELIVERY_TRACKER_BASE_URL') ||
      'https://apis.tracker.delivery';
  }

  /**
   * 입력된 택배사 명칭/코드를 Delivery Tracker API 지원 ID로 정규화합니다.
   */
  normalizeCarrierId(carrier: string): string {
    if (!carrier) return '';
    const key = carrier.trim().toLowerCase();
    return CARRIER_MAP[key] || key;
  }

  /**
   * 운송장 번호의 특수문자 및 공백을 제거합니다.
   */
  sanitizeTrackingNumber(trackingNumber: string): string {
    if (!trackingNumber) return '';
    return trackingNumber.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * 배송 상태 상세 정보를 조회합니다.
   * GET https://apis.tracker.delivery/carriers/{carrierId}/tracks/{trackingNumber}
   */
  async getTrackingInfo(
    carrier: string,
    trackingNumber: string,
  ): Promise<DeliveryTrackingInfo | null> {
    const carrierId = this.normalizeCarrierId(carrier);
    const cleanTrackingNumber = this.sanitizeTrackingNumber(trackingNumber);

    if (!carrierId || !cleanTrackingNumber) {
      return null;
    }

    try {
      const response = await lastValueFrom(
        this.httpService.get<DeliveryTrackingInfo>(
          `${this.baseUrl}/carriers/${carrierId}/tracks/${cleanTrackingNumber}`,
          { timeout: 5000 },
        ),
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        this.logger.debug(
          `배송 정보 없음 (carrier: ${carrierId}, trackingNumber: ${cleanTrackingNumber})`,
        );
        return null;
      }
      this.logger.warn(
        `배송 조회 실패 (carrier: ${carrierId}, trackingNumber: ${cleanTrackingNumber}): ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * 해당 운송장이 배송 완료 상태인지 여부를 판별합니다.
   */
  async isDelivered(carrier: string, trackingNumber: string): Promise<boolean> {
    const trackingInfo = await this.getTrackingInfo(carrier, trackingNumber);
    if (!trackingInfo) {
      return false;
    }

    const stateId = trackingInfo.state?.id?.toLowerCase();
    const stateText = trackingInfo.state?.text;

    if (stateId === 'delivered') {
      return true;
    }

    if (
      stateText &&
      (stateText.includes('배달완료') || stateText.includes('배송완료'))
    ) {
      return true;
    }

    return false;
  }
}
