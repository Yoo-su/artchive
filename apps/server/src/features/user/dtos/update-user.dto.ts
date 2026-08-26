import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: '닉네임', required: false })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  @IsString()
  @IsOptional()
  profileImageUrl?: string;

  @ApiProperty({ description: '실명', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '성별', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ description: '연령대', required: false })
  @IsString()
  @IsOptional()
  ageRange?: string;

  @ApiProperty({
    description: '이메일 주소 (로컬 가입자만 수정 가능)',
    required: false,
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsOptional()
  email?: string;
}
