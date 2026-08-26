import { API_PATHS, EmailLoginParams, EmailSignupParams, LoginResponse, User } from "@bookjeok/core";

import { privateApiClient, publicApiClient } from "../../client";

/**
 * 이메일 회원가입을 요청합니다.
 */
export const emailSignup = async (
  params: EmailSignupParams,
) => {
  const { data } = await publicApiClient.post<User>(API_PATHS.auth.emailRegister, params);
  return data;
};

/**
 * 이메일 로그인을 요청합니다.
 */
export const emailLogin = async (
  params: EmailLoginParams,
) => {
  const { data } = await publicApiClient.post<LoginResponse>(
    API_PATHS.auth.emailLogin,
    params,
  );
  return data;
};

/**
 * 소셜 로그인 후 발급된 1회용 인증 티켓을 토큰 및 사용자 정보로 교환합니다.
 * @param ticket 1회용 인증 티켓
 */
export const exchangeAuthTicket = async (ticket: string) => {
  const { data } = await publicApiClient.post<LoginResponse>(
    API_PATHS.auth.exchange,
    { ticket },
  );
  return data;
};

/**
 * 로그아웃을 요청하여 서버 측 토큰 버전을 무효화합니다.
 */
export const logout = async () => {
  const { data } = await privateApiClient.post<{ success: boolean }>(
    API_PATHS.auth.logout,
  );
  return data;
};

/**
 * 현재 로그인한 사용자의 프로필 정보를 조회합니다.
 * @returns 사용자 정보
 */
export const getUserProfile = async () => {
  const { data } = await privateApiClient.get<User>(API_PATHS.user.profile);
  return data;
};

/**
 * 이메일 인증 메일 재발송을 요청합니다.
 */
export const sendVerificationEmail = async () => {
  const { data } = await privateApiClient.post<{ success: boolean; message: string }>(
    API_PATHS.auth.sendVerificationEmail,
  );
  return data;
};

/**
 * 1회용 인증 토큰으로 이메일 인증을 완료합니다.
 */
export const verifyEmail = async (token: string) => {
  const { data } = await publicApiClient.post<{
    success: boolean;
    message: string;
    user: Partial<User>;
  }>(API_PATHS.auth.verifyEmail, { token });
  return data;
};

