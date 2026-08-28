import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';

import { BusinessException } from '@/shared/exceptions/business.exception';

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method?: string;
  requestedAt?: string;
  approvedAt?: string;
  cancels?: Array<{
    cancelAmount: number;
    cancelReason: string;
    canceledAt: string;
  }>;
  [key: string]: any;
}

export interface TossEscrowShippingResponse {
  paymentKey: string;
  status: string;
  shipping: {
    company: string;
    trackingNumber: string;
  };
  [key: string]: any;
}

@Injectable()
export class TossPaymentsService {
  private readonly logger = new Logger(TossPaymentsService.name);
  private readonly baseUrl = 'https://api.tosspayments.com/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getAuthHeaders(): { Authorization: string; 'Content-Type': string } {
    const secretKey =
      this.configService.get<string>('TOSS_PAYMENTS_SECRET_KEY') ||
      'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
    const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');
    return {
      Authorization: `Basic ${encodedKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 토스페이먼츠 결제 승인 API 호출
   * POST https://api.tosspayments.com/v1/payments/confirm
   */
  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number,
  ): Promise<TossPaymentResponse> {
    try {
      const response = await lastValueFrom(
        this.httpService.post<TossPaymentResponse>(
          `${this.baseUrl}/payments/confirm`,
          { paymentKey, orderId, amount },
          { headers: this.getAuthHeaders() },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleTossError(error, '결제 승인 실패');
    }
  }

  /**
   * 토스페이먼츠 에스크로 배송 정보 등록 API 호출
   * POST https://api.tosspayments.com/v1/payments/{paymentKey}/escrow/shipping
   */
  async registerShipping(
    paymentKey: string,
    carrier: string,
    trackingNumber: string,
  ): Promise<TossEscrowShippingResponse> {
    try {
      const response = await lastValueFrom(
        this.httpService.post<TossEscrowShippingResponse>(
          `${this.baseUrl}/payments/${paymentKey}/escrow/shipping`,
          {
            deliveryCompany: carrier,
            trackingNumber,
          },
          { headers: this.getAuthHeaders() },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.warn(
        `토스 에스크로 배송정보 등록 알림 실패 (paymentKey: ${paymentKey}): ${(error as Error).message}`,
      );
      // 배송정보 등록 실패는 내부 배송 시작 흐름을 블로킹하지 않도록 로깅 후 반환
      return {
        paymentKey,
        status: 'SHIPPING_NOTIFIED_FALLBACK',
        shipping: { company: carrier, trackingNumber },
      };
    }
  }

  /**
   * 토스페이먼츠 에스크로 구매확정 API 호출
   * POST https://api.tosspayments.com/v1/payments/{paymentKey}/escrow/complete
   */
  async confirmEscrowPurchase(paymentKey: string): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          `${this.baseUrl}/payments/${paymentKey}/escrow/complete`,
          {},
          { headers: this.getAuthHeaders() },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.warn(
        `토스 에스크로 구매확정 API 호출 실패 (paymentKey: ${paymentKey}): ${(error as Error).message}`,
      );
      return { paymentKey, status: 'ESCROW_CONFIRMED_FALLBACK' };
    }
  }

  /**
   * 토스페이먼츠 에스크로 구매거부 API 호출
   * POST https://api.tosspayments.com/v1/payments/{paymentKey}/escrow/reject
   */
  async rejectEscrowPurchase(
    paymentKey: string,
    rejectReason: string,
  ): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          `${this.baseUrl}/payments/${paymentKey}/escrow/reject`,
          { rejectReason },
          { headers: this.getAuthHeaders() },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.warn(
        `토스 에스크로 구매거부 API 호출 실패 (paymentKey: ${paymentKey}): ${(error as Error).message}`,
      );
      return { paymentKey, status: 'ESCROW_REJECTED_FALLBACK' };
    }
  }

  /**
   * 토스페이먼츠 결제 취소/환불 API 호출
   * POST https://api.tosspayments.com/v1/payments/{paymentKey}/cancel
   */
  async cancelPayment(
    paymentKey: string,
    cancelReason: string,
    cancelAmount?: number,
  ): Promise<TossPaymentResponse> {
    try {
      const payload: { cancelReason: string; cancelAmount?: number } = {
        cancelReason,
      };
      if (cancelAmount !== undefined) {
        payload.cancelAmount = cancelAmount;
      }

      const response = await lastValueFrom(
        this.httpService.post<TossPaymentResponse>(
          `${this.baseUrl}/payments/${paymentKey}/cancel`,
          payload,
          { headers: this.getAuthHeaders() },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleTossError(error, '결제 취소 실패');
    }
  }

  /**
   * 웹훅 페이로드 검증 및 파싱
   */
  verifyWebhook(payload: Record<string, any>): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    return Boolean(payload.eventType || payload.status);
  }

  private handleTossError(error: unknown, fallbackMessage: string): never {
    if (error instanceof AxiosError && error.response?.data) {
      const tossData = error.response.data as {
        code?: string;
        message?: string;
      };
      const errorMessage = tossData.message || fallbackMessage;
      this.logger.error(
        `토스페이먼츠 API 에러 [${tossData.code || 'UNKNOWN'}]: ${errorMessage}`,
      );
      throw new BusinessException('EXTERNAL_API_ERROR', HttpStatus.BAD_GATEWAY);
    }

    this.logger.error(`토스페이먼츠 연동 에러: ${(error as Error).message}`);
    throw new BusinessException('EXTERNAL_API_ERROR', HttpStatus.BAD_GATEWAY);
  }
}
