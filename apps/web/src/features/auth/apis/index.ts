import { emailLogin as sharedEmailLogin, emailSignup as sharedEmailSignup, getUserProfile as sharedGetUserProfile } from "@bookjeok/api-client/auth";
import { EmailLoginParams, EmailSignupParams } from "@bookjeok/core/auth";
import { AxiosInstance } from "axios";

/**
 * 이메일 회원가입을 요청합니다.
 */
export const emailSignup = async (client: AxiosInstance, params: EmailSignupParams) => {
  return sharedEmailSignup(client, params);
};

/**
 * 이메일 로그인을 요청합니다.
 */
export const emailLogin = async (client: AxiosInstance, params: EmailLoginParams) => {
  return sharedEmailLogin(client, params);
};

/**
 * 현재 로그인한 사용자의 프로필 정보를 조회합니다.
 * @returns 사용자 정보
 */
export const getUserProfile = async (client: AxiosInstance) => {
  return sharedGetUserProfile(client);
};
