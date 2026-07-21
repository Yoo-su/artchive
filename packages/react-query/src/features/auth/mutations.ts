import { emailLogin, emailSignup } from "@bookjeok/api-client";
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
