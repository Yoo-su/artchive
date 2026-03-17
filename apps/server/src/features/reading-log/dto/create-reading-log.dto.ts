import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReadingLogDto {
  @ApiProperty({ description: '책 ISBN', example: '9788937460449' })
  @IsString()
  @IsNotEmpty()
  bookIsbn: string;

  @ApiProperty({ description: '책 제목', example: '소년이 온다' })
  @IsString()
  @IsNotEmpty()
  bookTitle: string;

  @ApiProperty({
    description: '책 표지 이미지 URL',
    example: 'https://image.url/book.jpg',
  })
  @IsString()
  @IsNotEmpty()
  bookImage: string;

  @ApiProperty({ description: '저자', example: '한강' })
  @IsString()
  @IsNotEmpty()
  bookAuthor: string;

  @ApiProperty({ description: '읽은 날짜 (YYYY-MM-DD)', example: '2023-10-01' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: '한 줄 메모 (선택, 최대 50자)',
    example: '깊은 울림을 주는 책이었다.',
    required: false,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  memo?: string;
}
