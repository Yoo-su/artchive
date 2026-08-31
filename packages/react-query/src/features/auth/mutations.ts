"use client";

import {
  emailLogin,
  emailSignup,
  sendVerificationEmail,
  verifyEmail,
} from "@bookjeok/api-client";
import { EmailLoginParams, EmailSignupParams, User } from "@bookjeok/core";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

/**
 * 이메일 회원가입 뮤테이션
 */
export const useEmailSignupMutation = (
  options?: UseMutationOptions<User, Error, EmailSignupParams>,
) => {
  return useMutation({
    mutationFn: (params: EmailSignupParams) => emailSignup(params),
    ...options,
  });
};

/**
 * 이메일 로그인 뮤테이션
 */
export const useEmailLoginMutation = (
  options?: UseMutationOptions<{ accessToken: string; refreshToken: string; user: User }, Error, EmailLoginParams>,
) => {
  return useMutation({
    mutationFn: (params: EmailLoginParams) => emailLogin(params),
    ...options,
  });
};

/**
 * 이메일 인증 메일 재발송 뮤테이션
 */
export const useSendVerificationEmailMutation = (
  options?: UseMutationOptions<{ success: boolean; message: string }, Error, void>,
) => {
  return useMutation({
    mutationFn: () => sendVerificationEmail(),
    ...options,
  });
};

/**
 * 이메일 인증 토큰 검증 뮤테이션
 */
export const useVerifyEmailMutation = (
  options?: UseMutationOptions<
    { success: boolean; message: string; user: Partial<User> },
    Error,
    string
  >,
) => {
  return useMutation({
    mutationFn: (token: string) => verifyEmail(token),
    ...options,
  });
};
