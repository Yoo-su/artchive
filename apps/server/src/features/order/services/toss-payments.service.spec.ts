import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { of, throwError } from 'rxjs';

import { BusinessException } from '@/shared/exceptions/business.exception';

import {
  TossPaymentResponse,
  TossPaymentsService,
} from './toss-payments.service';

describe('TossPaymentsService', () => {
  let service: TossPaymentsService;
  let mockHttpService: { post: jest.Mock };

  const mockSecretKey = 'test_sk_test_key_123';

  const createAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  });

  beforeEach(async () => {
    mockHttpService = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TossPaymentsService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string): string => {
              if (key === 'TOSS_PAYMENTS_SECRET_KEY') return mockSecretKey;
              return '';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TossPaymentsService>(TossPaymentsService);
  });

  describe('confirmPayment', () => {
    it('토스 결제 승인 API를 호출하고 성공 응답을 반환한다', async () => {
      const mockResponse: TossPaymentResponse = {
        paymentKey: 'test_payment_key',
        orderId: 'ORD-12345',
        status: 'DONE',
        totalAmount: 15000,
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(mockResponse)),
      );

      const result = await service.confirmPayment(
        'test_payment_key',
        'ORD-12345',
        15000,
      );

      expect(result).toEqual(mockResponse);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.tosspayments.com/v1/payments/confirm',
        {
          paymentKey: 'test_payment_key',
          orderId: 'ORD-12345',
          amount: 15000,
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic '),
          }),
        }),
      );
    });

    it('토스 API 에러 발생 시 BusinessException(EXTERNAL_API_ERROR)을 던진다', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Toss API Error')),
      );

      await expect(
        service.confirmPayment('test_payment_key', 'ORD-12345', 15000),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('registerShipping', () => {
    it('배송 정보 등록 API를 호출한다', async () => {
      const mockResponse = {
        paymentKey: 'test_payment_key',
        status: 'SHIPPING',
        shipping: {
          company: 'CJ대한통운',
          trackingNumber: '1234567890',
        },
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(mockResponse)),
      );

      const result = await service.registerShipping(
        'test_payment_key',
        'CJ대한통운',
        '1234567890',
      );

      expect(result.status).toBe('SHIPPING');
      expect(result.shipping.company).toBe('CJ대한통운');
    });

    it('배송 정보 등록 실패 시 내부 흐름 중단 없이 fallback 결과를 반환한다', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Shipping Register Failed')),
      );

      const result = await service.registerShipping(
        'test_payment_key',
        'CJ대한통운',
        '1234567890',
      );

      expect(result.status).toBe('SHIPPING_NOTIFIED_FALLBACK');
    });
  });

  describe('confirmEscrowPurchase & rejectEscrowPurchase', () => {
    it('구매확정 API 호출 시 정상 응답을 반환한다', async () => {
      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse({ status: 'CONFIRMED' })),
      );

      const result = await service.confirmEscrowPurchase('test_payment_key');
      expect(result.status).toBe('CONFIRMED');
    });

    it('구매거부 API 호출 시 정상 응답을 반환한다', async () => {
      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse({ status: 'REJECTED' })),
      );

      const result = await service.rejectEscrowPurchase(
        'test_payment_key',
        '도서 파손',
      );
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('cancelPayment', () => {
    it('결제 취소 API를 호출하고 성공 응답을 반환한다', async () => {
      const mockResponse: TossPaymentResponse = {
        paymentKey: 'test_payment_key',
        orderId: 'ORD-12345',
        status: 'CANCELED',
        totalAmount: 15000,
        cancels: [
          {
            cancelAmount: 15000,
            cancelReason: '단순 변심',
            canceledAt: '2026-08-27T10:00:00Z',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(mockResponse)),
      );

      const result = await service.cancelPayment(
        'test_payment_key',
        '단순 변심',
      );

      expect(result.status).toBe('CANCELED');
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.tosspayments.com/v1/payments/test_payment_key/cancel',
        { cancelReason: '단순 변심' },
        expect.any(Object),
      );
    });
  });

  describe('verifyWebhook', () => {
    it('유효한 웹훅 페이로드를 올바르게 검증한다', () => {
      expect(
        service.verifyWebhook({
          eventType: 'PAYMENT_STATUS_CHANGED',
          data: { status: 'DONE' },
        }),
      ).toBe(true);
      expect(service.verifyWebhook(null as any)).toBe(false);
      expect(service.verifyWebhook({})).toBe(false);
    });
  });
});
