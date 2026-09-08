import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { isPaymentEnabled } from '@/shared/config/feature-flags';

@Injectable()
export class PaymentFeatureGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    if (!isPaymentEnabled()) {
      throw new ServiceUnavailableException(
        '결제 및 주문 기능이 현재 준비 중입니다.',
      );
    }

    return true;
  }
}
