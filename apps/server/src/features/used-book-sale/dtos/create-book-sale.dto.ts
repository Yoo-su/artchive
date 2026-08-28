import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import { TradeMethod } from '../entities/used-book-sale.entity';

export class CreateBookSaleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  @ApiProperty({
    description: '판매글 제목',
    example: '깨끗한 전공책 팝니다',
    minLength: 5,
    maxLength: 50,
  })
  title: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: '판매 가격', example: 15000, minimum: 0 })
  price: number;

  @IsOptional()
  @IsEnum(TradeMethod)
  @ApiPropertyOptional({
    description: '거래 방식',
    enum: TradeMethod,
    default: TradeMethod.DIRECT_ONLY,
    example: TradeMethod.BOTH,
  })
  tradeMethod?: TradeMethod;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '거래 희망 도시 (시/도)', example: '서울특별시' })
  city: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '거래 희망 구/군', example: '강남구' })
  district: string;

  @IsNumber()
  @ApiProperty({ description: '위도', example: 37.123456 })
  latitude: number;

  @IsNumber()
  @ApiProperty({ description: '경도', example: 127.123456 })
  longitude: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  @ApiProperty({
    description: '판매글 내용',
    example: '필기감 전혀 없는 새 책입니다.',
    minLength: 10,
    maxLength: 1000,
  })
  content: string;

  @IsArray()
  @IsUrl({ require_tld: false }, { each: true })
  @ApiProperty({
    description: '상품 이미지 URL 목록',
    example: ['https://example.com/image1.jpg'],
    type: [String],
  })
  imageUrls: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '책 ISBN', example: '1234567890123' })
  isbn: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '장소명', example: '스타벅스 앞' })
  placeName: string;
}
