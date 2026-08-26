import {
  emailLogin as sharedEmailLogin,
  emailSignup as sharedEmailSignup,
  getUserProfile as sharedGetUserProfile,
  sendVerificationEmail as sharedSendVerificationEmail,
  verifyEmail as sharedVerifyEmail,
} from "@bookjeok/api-client";
import { EmailLoginParams, EmailSignupParams } from "@bookjeok/core";

/**
 * 이메일 회원가입을 요청합니다.
 */
export const emailSignup = async (params: EmailSignupParams) => {
  return sharedEmailSignup(params);
};

/**
 * 이메일 로그인을 요청합니다.
 */
export const emailLogin = async (params: EmailLoginParams) => {
  return sharedEmailLogin(params);
};

/**
 * 현재 로그인한 사용자의 프로필 정보를 조회합니다.
 * @returns 사용자 정보
 */
export const getUserProfile = async () => {
  return sharedGetUserProfile();
};

/**
 * 이메일 인증 메일 재발송을 요청합니다.
 */
export const sendVerificationEmail = async () => {
  return sharedSendVerificationEmail();
};

/**
 * 1회용 인증 토큰으로 이메일 인증을 완료합니다.
 */
export const verifyEmail = async (token: string) => {
  return sharedVerifyEmail(token);
};
