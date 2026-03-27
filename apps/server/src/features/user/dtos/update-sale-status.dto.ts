import { IsEnum, IsNotEmpty } from 'class-validator';

import { SaleStatus } from '@/features/used-book-sale/entities/used-book-sale.entity';

export class UpdateSaleStatusDto {
  @IsNotEmpty()
  @IsEnum(SaleStatus)
  status: SaleStatus;
}
