import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class BookInfoDto {
  @IsString()
  @IsNotEmpty()
  isbn: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  publisher: string;

  @IsString()
  @IsNotEmpty()
  pubdate: string;

  @IsUrl()
  @IsNotEmpty()
  image: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  discount?: string;
}
