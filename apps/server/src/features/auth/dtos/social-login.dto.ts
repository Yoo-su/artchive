import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class SocialLoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '소셜 로그인 제공자 (예: naver, kakao)',
    example: 'naver',
  })
  provider: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '소셜 로그인 제공자 ID', example: '1234567890' })
  providerId: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '닉네임', example: '홍길동' })
  nickname: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profileImageUrl?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '회원 실명',
    example: '홍길동',
    required: false,
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '성별',
    example: 'M',
    required: false,
  })
  gender?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '연령대',
    example: '20-29',
    required: false,
  })
  ageRange?: string;

  @IsOptional()
  @ApiProperty({
    description: '이메일 인증 여부',
    example: true,
    required: false,
  })
  isEmailVerified?: boolean;
}
