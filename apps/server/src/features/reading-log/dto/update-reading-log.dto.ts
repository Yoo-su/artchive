import { PartialType } from '@nestjs/mapped-types';
import { CreateReadingLogDto } from './create-reading-log.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReadingLogDto extends PartialType(CreateReadingLogDto) {
  @ApiProperty({
    description: '수정할 메모 내용 (최대 50자)',
    example: '생각보다 밝은 내용이었다.',
    required: false,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  memo?: string;
}
