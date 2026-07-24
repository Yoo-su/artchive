import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AiSearchRequestDto {
  @ApiProperty({
    description: '사용자의 자연어 검색 질문',
    example: '잔잔한 위로가 되는 소설 추천해줘',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  query: string;
}

export class BookSearchResultDto {
  @ApiProperty({ description: 'ISBN' })
  isbn: string;

  @ApiProperty({ description: '도서 제목' })
  title: string;

  @ApiProperty({ description: '저자' })
  author: string;

  @ApiProperty({ description: '출판사' })
  publisher: string;

  @ApiProperty({ description: '도서 설명' })
  description: string;

  @ApiProperty({ description: '표지 이미지 URL' })
  image: string;

  @ApiProperty({ description: '벡터 코사인 유사도 (0~1)' })
  similarity: number;
}

export class AiSearchResponseDto {
  @ApiProperty({
    description: '검색된 후보 도서 목록',
    type: [BookSearchResultDto],
  })
  books: BookSearchResultDto[];

  @ApiProperty({
    description: 'RAG 기반 AI 추천 코멘트 문구',
  })
  explanation: string;
}
