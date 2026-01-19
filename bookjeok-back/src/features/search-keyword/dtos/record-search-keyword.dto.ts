import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 검색어 기록 요청 DTO
 */
export class RecordSearchKeywordDto {
  @ApiProperty({
    description: '검색어',
    example: '해리포터',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  keyword: string;
}
