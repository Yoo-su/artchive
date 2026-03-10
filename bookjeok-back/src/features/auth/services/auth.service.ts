import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

    // 신규 유저인 경우: 랜덤 닉네임 생성 (중복 시 재시도) + 기본 프로필 이미지 번호 부여
    let randomNickname = NicknameGenerator.generate();
    let isUnique = false;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    while (!isUnique && retryCount < MAX_RETRIES) {
      if (retryCount > 0) {
        // 첫 시도 실패 시 뒤에 랜덤 숫자(1000~9999)를 붙여 중복 확률 최소화
        const suffix = Math.floor(1000 + Math.random() * 9000);
        randomNickname = `${NicknameGenerator.generate()}${suffix}`;
      }

      const existingUser =
        await this.userService.findByNickname(randomNickname);
      if (!existingUser) {
        isUnique = true;
      } else {
        retryCount++;
      }
    }

    if (!isUnique) {
      // 5번 재시도 후에도 중복이면 타임스탬프를 붙여서 강제 유니크 생성
      randomNickname = `${NicknameGenerator.generate()}${Date.now().toString().slice(-4)}`;
    }

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

    // 마지막 활동 시간 업데이트
    await this.userService.updateLastActiveAt(user.id);

    return { accessToken, refreshToken, user };
  }

  /**
   * Refresh Token을 사용하여 새로운 토큰을 발급합니다.
   * @param userId 유저 ID
   * @param nickname 유저 닉네임
   * @returns 새로운 Access Token과 Refresh Token
   */
  async refresh(userId: number, nickname: string) {
    // 토큰 갱신 시 마지막 활동 시간도 업데이트
    await this.userService.updateLastActiveAt(userId);
    return await this.getTokens(userId, nickname);
  }

  /**
   * 이메일 회원가입을 처리합니다.
   * @param registerDto 회원가입 정보
   * @returns 생성된 유저
   */
  async register(registerDto: {
    email: string;
    password: string;
    nickname: string;
  }) {
    const { email, password, nickname } = registerDto;

    // 1. 이메일 중복 체크
    const existingEmail = await this.userService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    // 2. 닉네임 중복 체크
    const isNicknameAvailable =
      await this.userService.checkNicknameAvailability(nickname);
    if (!isNicknameAvailable) {
      throw new ConflictException('NICKNAME_ALREADY_EXISTS');
    }

    // 3. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 유저 생성
    return await this.userService.createEmailUser(
      email,
      hashedPassword,
      nickname,
    );
  }

  /**
   * 이메일 로그인을 처리합니다.
   * @param loginDto 로그인 정보
   * @returns 토큰과 유저 정보
   */
  async login(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;

    // 1. 이메일로 유저 찾기
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // 2. 소셜 로그인 유저인지 확인 (비밀번호가 없는 경우)
    if (!user.password) {
      throw new UnauthorizedException('SOCIAL_LOGIN_USER');
    }

    // 3. 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // 4. 토큰 발급
    return await this.socialLogin(user);
  }
}
