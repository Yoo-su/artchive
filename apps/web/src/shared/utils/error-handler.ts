import { handleApiError } from "@bookjeok/api-client";
import { toast } from "sonner";

/**
 * Mutation 에러를 HTTP 상태 코드별로 분기 처리하는 공통 유틸리티입니다.
 * @bookjeok/api-client의 공통 로직을 사용하며, 웹 플랫폼에 맞게 toast로 출력합니다.
 *
 * @param error 발생한 에러 객체
 * @param context 에러 발생 컨텍스트 설명 (로깅용)
 */
export const handleMutationError = (error: unknown, context?: string) => {
  handleApiError(error, {
    context,
    onShowError: (message) => toast.error(message),
  });
};
