import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserService } from '@/features/user/services/user.service';

import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found or deactivated.');
    }
    return user;
  }
}
