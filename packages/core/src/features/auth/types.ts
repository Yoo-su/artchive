export type UserRole = "USER" | "ADMIN";

export interface User {
  /** 우리 서비스에서 사용하는 고유 ID */
  id: number;

  /** 소셜 로그인 제공자 (e.g., 'kakao', 'naver') */
  provider: string;

  /** 소셜 로그인 제공자가 부여하는 고유 ID */
  providerId: string;

  /** 사용자 이메일 (선택) */
  email: string | null;

  /** 사용자 고유 핸들 (URL에 사용) */
  handle: string;

  /** 사용자 닉네임 */
  nickname: string;

  /** 프로필 이미지 URL (선택) */
  profileImageUrl: string | null;

  /** 계정 생성일 (ISO 8601 형식의 문자열) */
  createdAt: string;

  /** 계정 수정일 (ISO 8601 형식의 문자열) */
  updatedAt: string;

  /** 독서 기록 공개 여부 */
  isReadingLogPublic: boolean;

  /** 사용자 권한 (USER 또는 ADMIN) */
  role: UserRole;
}

export interface EmailLoginParams {
  email: string;
  password: string;
}

export interface EmailSignupParams {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
