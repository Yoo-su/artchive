import { AxiosError } from "axios";

/**
 * API 에러 발생 시 공통적으로 처리할 메시지를 추출하고 콜백을 실행합니다.
 * 플랫폼(Web/Expo) 독립적으로 동작하도록 UI 처리는 콜백으로 위임합니다.
 *
 * @param error 발생한 에러 객체
 * @param options 에러 처리 옵션 (콜백 등)
 */
export const handleApiError = (
  error: unknown,
  options?: {
    onShowError?: (message: string) => void;
    context?: string;
  }
) => {
  let message = "오류가 발생했습니다. 다시 시도해주세요.";

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    switch (status) {
      case 401:
        // 인증 만료는 보통 인터셉터 수준에서 처리하므로 메시지 처리를 스킵할 수 있음
        return;
      case 403:
        message = "권한이 없습니다.";
        break;
      case 404:
        message = "요청한 리소스를 찾을 수 없습니다.";
        break;
      case 409:
        message = serverMessage || "이미 처리된 요청입니다.";
        break;
      case 413:
        message = "파일 크기가 너무 큽니다.";
        break;
      default:
        message = serverMessage || message;
    }
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  // UI 알림 처리 (웹의 toast, 앱의 Alert 등)
  if (options?.onShowError) {
    options.onShowError(message);
  }

  // 에러 로깅
  if (options?.context) {
    console.error(`[${options.context}]`, error);
  }

  return message;
};
