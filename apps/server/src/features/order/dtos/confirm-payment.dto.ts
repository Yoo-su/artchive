import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: '토스페이먼츠 결제 키',
    example: 'tviva20260827103000...',
  })
  @IsString()
  @IsNotEmpty()
  paymentKey: string;

  @ApiProperty({ description: '결제 금액 (위변조 검증용)', example: 15000 })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: '수령인 이름', example: '홍길동' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ description: '수령인 전화번호', example: '010-1234-5678' })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({ description: '우편번호', example: '06234' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({
    description: '기본 배송지 주소',
    example: '서울특별시 강남구 테헤란로 123',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: '상세 주소', example: '101동 1001호' })
  @IsString()
  @IsOptional()
  addressDetail?: string;
}
