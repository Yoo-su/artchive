import { emailLogin, emailSignup } from "@bookjeok/api-client/auth";
import { EmailLoginParams, EmailSignupParams, User } from "@bookjeok/core/auth";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 이메일 회원가입 뮤테이션
 */
export const useEmailSignupMutation = (
  client: AxiosInstance,
  options?: UseMutationOptions<User, Error, EmailSignupParams>,
) => {
  return useMutation({
    mutationFn: (params: EmailSignupParams) => emailSignup(client, params),
    ...options,
  });
};

/**
 * 이메일 로그인 뮤테이션
 */
export const useEmailLoginMutation = (
  client: AxiosInstance,
  options?: UseMutationOptions<{ accessToken: string; refreshToken: string; user: User }, Error, EmailLoginParams>,
) => {
  return useMutation({
    mutationFn: (params: EmailLoginParams) => emailLogin(client, params),
    ...options,
  });
};
