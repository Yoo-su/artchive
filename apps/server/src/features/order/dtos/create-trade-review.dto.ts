import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { TradeReviewTag } from '../entities/trade-review.entity';

export class CreateTradeReviewDto {
  @ApiProperty({
    description: '거래 주문 ID',
    example: 'ORD-1724800000-8F92A1',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: '거래 후기 평가 태그 목록 (최소 1개)',
    enum: TradeReviewTag,
    isArray: true,
    example: [TradeReviewTag.GOOD_CONDITION, TradeReviewTag.FAST_SHIPPING],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(TradeReviewTag, { each: true })
  tags: TradeReviewTag[];

  @ApiPropertyOptional({
    description: '한 줄 텍스트 후기 내용 (최대 500자)',
    example: '책 상태가 설명과 똑같고 배송도 빨랐습니다.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  content?: string;
}
