import {
  useEmailLoginMutation as useBaseEmailLoginMutation,
  useEmailSignupMutation as useBaseEmailSignupMutation,
} from "@bookjeok/react-query";
import { toast } from "sonner";

/**
 * 이메일 로그인 뮤테이션
 */
export const useEmailLoginMutation = () =>
  useBaseEmailLoginMutation({
    onSuccess: () => {
      toast.success("성공적으로 로그인되었습니다.");
    },
    onError: () => {
      toast.error(
        "로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.",
      );
    },
  });

/**
 * 이메일 회원가입 뮤테이션
 */
export const useEmailSignupMutation = () =>
  useBaseEmailSignupMutation({
    onSuccess: () => {
      toast.success("회원가입이 완료되었습니다! 로그인해 주세요.");
    },
    onError: () => {
      toast.error("회원가입에 실패했습니다. 이미 가입된 이메일일 수 있습니다.");
    },
  });
