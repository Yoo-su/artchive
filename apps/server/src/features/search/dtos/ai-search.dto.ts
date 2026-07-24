import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class ChatMessageDto {
  @ApiProperty({
    description: '발화자 역할',
    enum: ChatRole,
    example: ChatRole.USER,
  })
  @IsEnum(ChatRole)
  role: ChatRole;

  @ApiProperty({
    description: '메시지 텍스트 내용',
    example: '퇴근길에 읽기 좋은 가벼운 에세이 추천해줘',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AiSearchRequestDto {
  @ApiProperty({
    description: '이전 대화 내역을 포함한 전체 대화 메시지 배열',
    type: [ChatMessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
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

  @ApiPropertyOptional({
    description: 'RAG가 생성한 이 개별 도서의 추천 이유 문구',
    example:
      '퇴근길의 번잡함을 씻어내주는 조용하고 따뜻한 어조의 일상 에세이입니다.',
  })
  reason?: string;
}

export class AiSearchResponseDto {
  @ApiProperty({
    description: 'AI의 답변 메시지 (꼬리 질문 또는 추천 설명 문구)',
    example:
      '오늘 하루도 수고 많으셨어요. 퇴근길 마음을 따뜻하게 가다듬어 줄 에세이 3권을 골라봤습니다.',
  })
  message: string;

  @ApiProperty({
    description:
      '추천된 도서 목록 (추천 단계가 아닌 추가 질문 단계일 경우 빈 배열)',
    type: [BookSearchResultDto],
  })
  books: BookSearchResultDto[];
}
