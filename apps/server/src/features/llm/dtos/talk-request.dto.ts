import { IsOptional, IsString } from 'class-validator';

export class TalkRequestDto {
  @IsString()
  message: string;

  /**
   * 이전 대화 기록 (필요 시 사용)
   * 예: "user: 안녕\nai: 반가워요" 형태의 문자열
   */
  @IsOptional()
  @IsString()
  history?: string;
}
