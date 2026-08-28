import { ExecutionContext, HttpStatus } from '@nestjs/common';

import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { EmailVerifiedGuard } from './email-verified.guard';

describe('EmailVerifiedGuard', () => {
  let guard: EmailVerifiedGuard;

  beforeEach(() => {
    guard = new EmailVerifiedGuard();
  });

  const createMockContext = (user?: Partial<User> | null): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('사용자 정보가 없으면 AUTH_UNAUTHORIZED 예외를 던진다', () => {
    const context = createMockContext(null);

    expect(() => guard.canActivate(context)).toThrow(BusinessException);
    try {
      guard.canActivate(context);
    } catch (error) {
      expect((error as BusinessException).getStatus()).toBe(
        HttpStatus.UNAUTHORIZED,
      );
    }
  });

  it('이메일 미인증 사용자(isEmailVerified: false)이면 EMAIL_NOT_VERIFIED 예외를 던진다', () => {
    const context = createMockContext({ id: 1, isEmailVerified: false });

    expect(() => guard.canActivate(context)).toThrow(BusinessException);
    try {
      guard.canActivate(context);
    } catch (error) {
      expect((error as BusinessException).getStatus()).toBe(
        HttpStatus.FORBIDDEN,
      );
      expect((error as BusinessException).errorCode).toBe('EMAIL_NOT_VERIFIED');
    }
  });

  it('이메일 인증 사용자(isEmailVerified: true)이면 true를 반환한다', () => {
    const context = createMockContext({ id: 1, isEmailVerified: true });

    expect(guard.canActivate(context)).toBe(true);
  });
});
