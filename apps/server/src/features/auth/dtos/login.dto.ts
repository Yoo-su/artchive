import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '이메일 주소',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호',
  })
  @IsString()
  password!: string;
}
