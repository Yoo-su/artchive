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
 * 현재 로그인한 사용자의 프로필 정보를 조회합니다.
 * @returns 사용자 정보
 */
export const getUserProfile = async () => {
  const { data } = await privateApiClient.get<User>(API_PATHS.user.profile);
  return data;
};
