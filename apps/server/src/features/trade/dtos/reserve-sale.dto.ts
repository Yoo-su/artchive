import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class ReserveSaleDto {
  @ApiProperty({ description: '거래 상대로 지정할 구매희망자 ID' })
  @IsInt()
  @IsPositive()
  buyerId: number;

  @ApiPropertyOptional({
    description:
      '거래가 진행 중인 채팅방 ID. 넘기면 해당 방의 활성 참여자인지 검증합니다.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  chatRoomId?: number;
}
