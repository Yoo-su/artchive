import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '이메일 주소',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호 (최소 8자)',
  })
  @IsString()
  @Length(8, 20, { message: '비밀번호는 8자 이상 20자 이하로 입력해주세요.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*[!@#$%^&*+=-])(?=.*[0-9]).{8,20}$/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
  })
  password!: string;

  @ApiProperty({
    example: 'booklover',
    description: '닉네임 (2~10자)',
  })
  @IsString()
  @Length(2, 10, { message: '닉네임은 2자 이상 10자 이하로 입력해주세요.' })
  @Matches(/^[a-zA-Z0-9가-힣]+$/, {
    message: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
  })
  nickname!: string;

  @ApiProperty({
    example: '홍길동',
    description: '회원 실명',
  })
  @IsString()
  @Length(1, 50, { message: '이름을 올바르게 입력해주세요.' })
  name!: string;

  @ApiProperty({
    example: 'M',
    description: '성별 (M, F, U 또는 미입력)',
    required: false,
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    example: '20-29',
    description:
      '연령대 (0-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60- 또는 미입력)',
    required: false,
  })
  @IsString()
  @IsOptional()
  ageRange?: string;
}
