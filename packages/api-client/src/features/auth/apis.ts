import { API_PATHS } from "@bookjeok/core";
import { EmailLoginParams, EmailSignupParams, LoginResponse, User } from "@bookjeok/core/auth";
import { AxiosInstance } from "axios";

/**
 * 이메일 회원가입을 요청합니다.
 */
export const emailSignup = async (
  client: AxiosInstance,
  params: EmailSignupParams,
) => {
  const { data } = await client.post<User>(API_PATHS.auth.emailRegister, params);
  return data;
};

/**
 * 이메일 로그인을 요청합니다.
 */
export const emailLogin = async (
  client: AxiosInstance,
  params: EmailLoginParams,
) => {
  const { data } = await client.post<LoginResponse>(
    API_PATHS.auth.emailLogin,
    params,
  );
  return data;
};

/**
 * 현재 로그인한 사용자의 프로필 정보를 조회합니다.
 * @returns 사용자 정보
 */
export const getUserProfile = async (client: AxiosInstance) => {
  const { data } = await client.get<User>(API_PATHS.user.profile);
  return data;
};
