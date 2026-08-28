import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: '판매글 ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  saleId: number;

  @ApiProperty({ description: '구매자 사용자 ID', example: 2 })
  @IsInt()
  @IsNotEmpty()
  buyerId: number;

  @ApiPropertyOptional({ description: '연계된 채팅방 ID', example: 10 })
  @IsInt()
  @IsOptional()
  chatRoomId?: number;
}
