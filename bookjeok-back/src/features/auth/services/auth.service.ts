import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/features/user/services/user.service';

import { User } from '@/features/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.type';
import { TOKEN_EXPIRY } from '../auth.constants';
import { NicknameGenerator } from '@/features/user/utils/nickname-generator';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * 소셜 로그인 정보를 검증하고 유저를 생성하거나 반환합니다.
   * - 기존 유저: 그대로 반환 (provider 정보로 덮어쓰지 않음)
   * - 신규 유저: 랜덤 닉네임 + 기본 프로필 이미지 번호로 생성
   * @param socialLoginDto 소셜 로그인 정보
   * @returns 유저 정보
   */
  async validateUser(socialLoginDto: {
    provider: string;
    providerId: string;
    nickname: string;
    profileImg: string;
  }) {
    const { provider, providerId } = socialLoginDto;
    const user = await this.userService.findByProviderId(provider, providerId);

    // 기존 유저인 경우: 더 이상 provider 정보로 덮어쓰지 않고 그대로 반환
    if (user) {
      return user;
    }

    // 신규 유저인 경우: 랜덤 닉네임 + 기본 프로필 이미지 번호 부여
    const randomNickname = NicknameGenerator.generate();
    const profileNumber = NicknameGenerator.getRandomProfileNumber();

    const newUser = await this.userService.createUser({
      provider,
      providerId,
      nickname: randomNickname,
      // 기본 프로필 이미지 번호 저장 (프런트에서 해당 번호의 이미지 표시)
      profileImageUrl: `default_profile${profileNumber}`,
    });
    return newUser;
  }

  /**
   * 유저 ID와 닉네임을 기반으로 Access Token과 Refresh Token을 생성합니다.
   * @param userId 유저 ID
   * @param userNickname 유저 닉네임
   * @returns Access Token과 Refresh Token
   */
  async getTokens(userId: number, userNickname: string) {
    const payload: JwtPayload = { sub: userId, nickname: userNickname };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  /**
   * 소셜 로그인 성공 후 토큰과 유저 정보를 반환합니다.
   * @param user 유저 엔티티
   * @returns 토큰과 유저 정보
   */
  async socialLogin(user: User) {
    const { accessToken, refreshToken } = await this.getTokens(
      user.id,
      user.nickname,
    );

    return { accessToken, refreshToken, user };
  }

  /**
   * Refresh Token을 사용하여 새로운 토큰을 발급합니다.
   * @param userId 유저 ID
   * @param nickname 유저 닉네임
   * @returns 새로운 Access Token과 Refresh Token
   */
  async refresh(userId: number, nickname: string) {
    return await this.getTokens(userId, nickname);
  }
}
