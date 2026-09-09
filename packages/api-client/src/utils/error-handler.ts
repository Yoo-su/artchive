import { AxiosError } from "axios";

/**
 * API 응답 에러 객체에서 서버가 전달한 에러 메시지를 안전하게 추출합니다.
 * 1. 백엔드 GlobalExceptionFilter 포맷: error.response.data.error.message
 * 2. 표준/단일 메시지 포맷: error.response.data.message (문자열 또는 배열)
 * 3. 일반 Error 객체: error.message
 *
 * @param error 발생한 에러 객체
 * @param fallbackMessage 에러 메시지를 추출하지 못했을 때 사용할 기본 메시지
 */
export const getErrorMessage = (
  error: unknown,
  fallbackMessage: string = "오류가 발생했습니다. 다시 시도해주세요.",
): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data) {
      // 1. { success: false, error: { message: "..." } } 형태 (NestJS GlobalExceptionFilter)
      if (
        typeof data.error?.message === "string" &&
        data.error.message.trim()
      ) {
        return data.error.message;
      }
      // 2. { message: "..." } 또는 { message: ["..."] } 형태
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (Array.isArray(data.message) && data.message.length > 0) {
        return String(data.message[0]);
      }
      // 3. 문자열 응답
      if (typeof data === "string" && data.trim()) {
        return data;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

/**
 * 백엔드 GlobalExceptionFilter가 반환하는 에러 코드를 추출합니다.
 *
 * @param error 발생한 에러 객체
 */
export const getErrorCode = (error: unknown): string | undefined => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data?.error?.code && typeof data.error.code === "string") {
      return data.error.code;
    }
    if (data?.code && typeof data.code === "string") {
      return data.code;
    }
  }
  return undefined;
};

/**
 * API 에러 발생 시 공통적으로 처리할 메시지를 추출하고 콜백을 실행합니다.
 * 플랫폼(Web/Expo/Admin) 독립적으로 동작하도록 UI 처리는 콜백으로 위임합니다.
 *
 * @param error 발생한 에러 객체
 * @param options 에러 처리 옵션 (콜백 등)
 */
export const handleApiError = (
  error: unknown,
  options?: {
    onShowError?: (message: string) => void;
    context?: string;
  },
) => {
  let message = "오류가 발생했습니다. 다시 시도해주세요.";

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const serverMessage = getErrorMessage(error, "");

    switch (status) {
      case 401:
        // 인증 만료는 보통 인터셉터 수준에서 처리하므로 메시지 처리를 스킵할 수 있음
        return;
      case 403:
        message = serverMessage || "권한이 없습니다.";
        break;
      case 404:
        message = serverMessage || "요청한 리소스를 찾을 수 없습니다.";
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
