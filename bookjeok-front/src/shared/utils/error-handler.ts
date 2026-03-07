import { AxiosError } from "axios";
import { toast } from "sonner";

/**
 * Mutation 에러를 HTTP 상태 코드별로 분기 처리하는 공통 유틸리티입니다.
 *
 * @param error 발생한 에러 객체
 * @param context 에러 발생 컨텍스트 설명 (로깅용)
 */
export const handleMutationError = (error: unknown, context?: string) => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    switch (status) {
      case 401:
        // 인증 만료는 인터셉터에서 처리하므로 여기서는 무시
        return;
      case 403:
        toast.error("권한이 없습니다.");
        return;
      case 404:
        toast.error("요청한 리소스를 찾을 수 없습니다.");
        return;
      case 409:
        toast.error(serverMessage || "이미 처리된 요청입니다.");
        return;
      case 413:
        toast.error("파일 크기가 너무 큽니다.");
        return;
      default:
        toast.error(serverMessage || "오류가 발생했습니다. 다시 시도해주세요.");
    }
  } else if (error instanceof Error) {
    toast.error(error.message || "오류가 발생했습니다. 다시 시도해주세요.");
  } else {
    toast.error("오류가 발생했습니다. 다시 시도해주세요.");
  }

  // 에러 로깅 (향후 Sentry 등 외부 모니터링 서비스 연동 가능)
  if (context) {
    console.error(`[${context}]`, error);
  }
};
