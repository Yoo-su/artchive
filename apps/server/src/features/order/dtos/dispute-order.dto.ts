import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DisputeOrderDto {
  @ApiProperty({
    description: '구매확정 거부 및 분쟁 제기 사유',
    example: '책 상태가 설명과 다르게 심하게 훼손되어 있습니다.',
  })
  @IsString()
  @IsNotEmpty()
  disputeReason: string;
}
