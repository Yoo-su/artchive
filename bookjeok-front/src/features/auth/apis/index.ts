import { API_PATHS } from "@/shared/constants/apis";
import { privateAxios, publicAxios } from "@/shared/libs/axios";

import { User } from "../types";

// 임시 타입 정의 (나중에 스키마에서 추론하거나 공용 타입으로 이동)
interface EmailLoginParams {
  email: string;
  password: string;
}

interface EmailSignupParams {
  email: string;
  password: string;
  nickname: string;
}

/**
 * 이메일 회원가입을 요청합니다.
 */
export const emailSignup = async (params: EmailSignupParams) => {
  const { data } = await publicAxios.post<User>(
    API_PATHS.auth.emailRegister,
    params,
  );
  return data;
};

/**
 * 이메일 로그인을 요청합니다.
 */
export const emailLogin = async (params: EmailLoginParams) => {
  const { data } = await publicAxios.post<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }>(API_PATHS.auth.emailLogin, params);
  return data;
};

/**
 * 현재 로그인한 사용자의 프로필 정보를 조회합니다.
 * @returns 사용자 정보
 */
export const getUserProfile = async () => {
  const { data: user } = await privateAxios.get<User>(API_PATHS.user.profile);
  return user;
};
