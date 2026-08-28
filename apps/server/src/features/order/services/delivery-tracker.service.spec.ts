import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import {
  DeliveryTrackerService,
  DeliveryTrackingInfo,
} from './delivery-tracker.service';

describe('DeliveryTrackerService', () => {
  let service: DeliveryTrackerService;
  let mockHttpService: { get: jest.Mock };

  beforeEach(async () => {
    mockHttpService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryTrackerService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'DELIVERY_TRACKER_BASE_URL') {
                return 'https://apis.tracker.delivery';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DeliveryTrackerService>(DeliveryTrackerService);
  });

  describe('normalizeCarrierId', () => {
    it('국내 주요 택배사 명칭을 표준 ID로 변환해야 한다', () => {
      expect(service.normalizeCarrierId('CJ대한통운')).toBe('kr.cjlogistics');
      expect(service.normalizeCarrierId('cj')).toBe('kr.cjlogistics');
      expect(service.normalizeCarrierId('롯데택배')).toBe('kr.lotte');
      expect(service.normalizeCarrierId('한진택배')).toBe('kr.hanjin');
      expect(service.normalizeCarrierId('로젠택배')).toBe('kr.logen');
      expect(service.normalizeCarrierId('우체국택배')).toBe('kr.epost');
      expect(service.normalizeCarrierId('CU 편의점택배')).toBe('kr.cupost');
      expect(service.normalizeCarrierId('GS Postbox')).toBe('kr.cvsnet');
    });

    it('매핑 테이블에 없는 택배사는 소문자로 반환해야 한다', () => {
      expect(service.normalizeCarrierId('custom-carrier')).toBe(
        'custom-carrier',
      );
    });

    it('빈 문자열 입력 시 빈 문자열을 반환해야 한다', () => {
      expect(service.normalizeCarrierId('')).toBe('');
    });
  });

  describe('sanitizeTrackingNumber', () => {
    it('운송장 번호의 하이픈과 공백을 제거해야 한다', () => {
      expect(service.sanitizeTrackingNumber('1234-5678-9012')).toBe(
        '123456789012',
      );
      expect(service.sanitizeTrackingNumber(' 6098 1234 5678 ')).toBe(
        '609812345678',
      );
    });
  });

  describe('getTrackingInfo', () => {
    it('배송 상태 정보를 정상적으로 조회해야 한다', async () => {
      const mockTrackingData: DeliveryTrackingInfo = {
        carrier: { id: 'kr.cjlogistics', name: 'CJ대한통운' },
        state: { id: 'in_transit', text: '배송중' },
        progresses: [
          {
            time: '2026-08-27T09:00:00Z',
            status: { id: 'in_transit', text: '배송중' },
            location: { name: '서울물류센터' },
            description: '배송 출발했습니다.',
          },
        ],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockTrackingData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse),
      );

      const result = await service.getTrackingInfo(
        'CJ대한통운',
        '1234-5678-9012',
      );

      expect(result).toEqual(mockTrackingData);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://apis.tracker.delivery/carriers/kr.cjlogistics/tracks/123456789012',
        { timeout: 5000 },
      );
    });

    it('API가 404를 반환하면 null을 반환해야 한다', async () => {
      const axiosError = new AxiosError(
        'Not Found',
        '404',
        undefined,
        undefined,
        {
          status: 404,
          data: { message: 'Tracking not found' },
        } as AxiosResponse,
      );

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      const result = await service.getTrackingInfo('CJ대한통운', '9999999999');
      expect(result).toBeNull();
    });

    it('네트워크 오류 발생 시 null을 반환하고 예외를 전파하지 않아야 한다', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Connection refused')),
      );

      const result = await service.getTrackingInfo('CJ대한통운', '1234567890');
      expect(result).toBeNull();
    });
  });

  describe('isDelivered', () => {
    it('state.id가 delivered이면 true를 반환해야 한다', async () => {
      jest.spyOn(service, 'getTrackingInfo').mockResolvedValue({
        carrier: { id: 'kr.cjlogistics', name: 'CJ대한통운' },
        state: { id: 'delivered', text: '배송 완료' },
        progresses: [],
      });

      const result = await service.isDelivered('CJ대한통운', '1234567890');
      expect(result).toBe(true);
    });

    it('state.text에 배달완료가 포함되어 있으면 true를 반환해야 한다', async () => {
      jest.spyOn(service, 'getTrackingInfo').mockResolvedValue({
        carrier: { id: 'kr.cjlogistics', name: 'CJ대한통운' },
        state: { id: 'done', text: '배달완료 (고객 전달)' },
        progresses: [],
      });

      const result = await service.isDelivered('CJ대한통운', '1234567890');
      expect(result).toBe(true);
    });

    it('배송중 상태이면 false를 반환해야 한다', async () => {
      jest.spyOn(service, 'getTrackingInfo').mockResolvedValue({
        carrier: { id: 'kr.cjlogistics', name: 'CJ대한통운' },
        state: { id: 'in_transit', text: '배달중' },
        progresses: [],
      });

      const result = await service.isDelivered('CJ대한통운', '1234567890');
      expect(result).toBe(false);
    });

    it('조회 실패 시 false를 반환해야 한다', async () => {
      jest.spyOn(service, 'getTrackingInfo').mockResolvedValue(null);

      const result = await service.isDelivered('CJ대한통운', '1234567890');
      expect(result).toBe(false);
    });
  });
});
