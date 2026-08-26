import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function SocialAuth(provider: 'naver') {
  return applyDecorators(UseGuards(AuthGuard(provider)));
}
