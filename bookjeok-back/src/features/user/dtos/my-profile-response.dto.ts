import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class MyProfileResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: number;

  @ApiProperty({ description: '이메일' })
  email: string;

  @ApiProperty({ description: '닉네임' })
  nickname: string;

  @ApiProperty({ description: '핸들 (고유 ID)' })
  handle: string;

  @ApiProperty({ description: '프로필 이미지 URL', nullable: true })
  profileImageUrl: string | null;

  @ApiProperty({ description: '독서 기록 공개 여부' })
  isReadingLogPublic: boolean;

  @ApiProperty({ description: '소셜 로그인 제공자' })
  provider: string;

  @ApiProperty({ description: '소셜 로그인 제공자 ID' })
  providerId: string;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.nickname = user.nickname;
    this.handle = user.handle;
    this.profileImageUrl = user.profileImageUrl;
    this.isReadingLogPublic = user.isReadingLogPublic;
    this.provider = user.provider;
    this.providerId = user.providerId;
  }
}
