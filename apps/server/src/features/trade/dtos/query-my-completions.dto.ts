import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const TRADE_ROLE_FILTERS = ['ALL', 'BUYER', 'SELLER'] as const;
export type TradeRoleFilter = (typeof TRADE_ROLE_FILTERS)[number];

export class QueryMyCompletionsDto {
  @ApiPropertyOptional({
    description: '내 역할 기준 필터 (기본값: ALL)',
    enum: TRADE_ROLE_FILTERS,
  })
  @IsOptional()
  @IsIn(TRADE_ROLE_FILTERS as readonly string[])
  role: TradeRoleFilter = 'ALL';

  @ApiPropertyOptional({ description: '페이지 번호 (기본값: 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: '페이지 당 조회 건수 (기본값: 10, 최대: 50)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
