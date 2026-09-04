import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class CompleteTradeDto {
  @ApiPropertyOptional({
    description:
      '거래 상대 ID. 생략하면 예약 상대를 사용하고, 예약 상대도 없으면 ' +
      '판매완료 처리만 하고 후기는 열리지 않습니다.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  buyerId?: number;

  @ApiPropertyOptional({ description: '거래가 진행된 채팅방 ID' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  chatRoomId?: number;
}
