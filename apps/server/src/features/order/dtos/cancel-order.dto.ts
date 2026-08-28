import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({
    description: '주문 취소 사유',
    example: '구매자의 요청으로 거래를 취소합니다.',
  })
  @IsString()
  @IsOptional()
  cancelReason?: string;
}
