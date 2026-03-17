import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: '닉네임', required: false })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}
