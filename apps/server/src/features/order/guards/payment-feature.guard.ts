import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentFeatureGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const isPaymentEnabled =
      this.configService.get<string>('FEATURE_PAYMENT_ENABLED') === 'true' ||
      process.env.FEATURE_PAYMENT_ENABLED === 'true';

    if (!isPaymentEnabled) {
      throw new ServiceUnavailableException(
        '결제 및 주문 기능이 현재 준비 중입니다.',
      );
    }

    return true;
  }
}
