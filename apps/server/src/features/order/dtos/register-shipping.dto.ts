import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterShippingDto {
  @ApiProperty({ description: '택배사명 또는 코드', example: 'CJ대한통운' })
  @IsString()
  @IsNotEmpty()
  carrier: string;

  @ApiProperty({ description: '운송장 번호', example: '123456789012' })
  @IsString()
  @IsNotEmpty()
  trackingNumber: string;
}
