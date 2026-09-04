import { IsIn, IsNotEmpty } from 'class-validator';

import { SaleStatus } from '@/features/used-book-sale/entities/used-book-sale.entity';

/**
 * 판매자가 직접 지정할 수 있는 상태.
 *
 * `WITHDRAWN`은 회원 탈퇴 시 시스템이 판매글을 숨기려고 쓰는 값이므로
 * 사용자 입력으로는 받지 않습니다. `IsEnum(SaleStatus)`로 두면 API를 직접
 * 호출해 판매글을 탈퇴 상태로 위조할 수 있습니다.
 */
export const USER_SETTABLE_SALE_STATUSES = [
  SaleStatus.FOR_SALE,
  SaleStatus.RESERVED,
  SaleStatus.SOLD,
] as const;

export class UpdateSaleStatusDto {
  @IsNotEmpty()
  @IsIn(USER_SETTABLE_SALE_STATUSES as readonly string[])
  status: (typeof USER_SETTABLE_SALE_STATUSES)[number];
}
