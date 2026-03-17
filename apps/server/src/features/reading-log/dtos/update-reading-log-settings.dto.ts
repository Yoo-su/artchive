import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateReadingLogSettingsDto {
  @ApiProperty({
    description: '독서 기록 공개 여부',
    example: true,
  })
  @IsBoolean()
  isReadingLogPublic: boolean;
}
