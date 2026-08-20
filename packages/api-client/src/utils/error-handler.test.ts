import { AxiosError, AxiosHeaders, AxiosResponse } from "axios";
import { describe, expect, it, vi } from "vitest";

import {
  getErrorCode,
  getErrorMessage,
  handleApiError,
} from "./error-handler";

const createMockAxiosError = (
  status: number,
  data: any
): AxiosError => {
  const headers = new AxiosHeaders();
  const response: AxiosResponse = {
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers,
    config: { headers } as any,
  };

  const error = new AxiosError(
    "Request failed",
    "ERR_BAD_RESPONSE",
    { headers } as any,
    {},
    response
  );
  return error;
};

describe("error-handler utils", () => {
  describe("getErrorMessage", () => {
    it("NestJS GlobalExceptionFilter 구조({ success: false, error: { message } })에서 메시지를 정상 추출해야 한다", () => {
      const axiosError = createMockAxiosError(409, {
        success: false,
        error: {
          code: "CONFLICT",
          message: "EMAIL_ALREADY_EXISTS",
        },
      });

      expect(getErrorMessage(axiosError)).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("레거시/표준 구조({ message: '...' })에서 메시지를 정상 추출해야 한다", () => {
      const axiosError = createMockAxiosError(400, {
        message: "Invalid parameters",
      });

      expect(getErrorMessage(axiosError)).toBe("Invalid parameters");
    });

    it("배열 형태 메시지({ message: ['...'] })에서 첫 번째 메시지를 추출해야 한다", () => {
      const axiosError = createMockAxiosError(400, {
        message: ["Email is required", "Password is too short"],
      });

      expect(getErrorMessage(axiosError)).toBe("Email is required");
    });

    it("단순 문자열 응답 본문에서 문자열을 반환해야 한다", () => {
      const axiosError = createMockAxiosError(500, "Internal Server Error");

      expect(getErrorMessage(axiosError)).toBe("Internal Server Error");
    });

    it("일반 Error 인스턴스에서 error.message를 반환해야 한다", () => {
      const error = new Error("Custom client error");
      expect(getErrorMessage(error)).toBe("Custom client error");
    });

    it("알 수 없는 형태의 에러 발생 시 fallbackMessage를 반환해야 한다", () => {
      expect(getErrorMessage(null, "커스텀 기본 에러")).toBe("커스텀 기본 에러");
      expect(getErrorMessage({})).toBe("오류가 발생했습니다. 다시 시도해주세요.");
    });
  });

  describe("getErrorCode", () => {
    it("NestJS GlobalExceptionFilter 구조에서 에러 코드를 정상 추출해야 한다", () => {
      const axiosError = createMockAxiosError(401, {
        success: false,
        error: {
          code: "AUTH_UNAUTHORIZED",
          message: "SOCIAL_LOGIN_USER",
        },
      });

      expect(getErrorCode(axiosError)).toBe("AUTH_UNAUTHORIZED");
    });

    it("에러 코드가 없을 경우 undefined를 반환해야 한다", () => {
      const error = new Error("Random error");
      expect(getErrorCode(error)).toBeUndefined();
    });
  });

  describe("handleApiError", () => {
    it("onShowError 콜백으로 백엔드 GlobalExceptionFilter 메시지를 올바르게 전달해야 한다", () => {
      const onShowError = vi.fn();
      const axiosError = createMockAxiosError(409, {
        success: false,
        error: {
          code: "CONFLICT",
          message: "NICKNAME_ALREADY_EXISTS",
        },
      });

      const message = handleApiError(axiosError, { onShowError });

      expect(message).toBe("NICKNAME_ALREADY_EXISTS");
      expect(onShowError).toHaveBeenCalledWith("NICKNAME_ALREADY_EXISTS");
    });

    it("401 에러의 경우 콜백을 실행하지 않고 패스해야 한다", () => {
      const onShowError = vi.fn();
      const axiosError = createMockAxiosError(401, {
        success: false,
        error: {
          code: "AUTH_UNAUTHORIZED",
          message: "Unauthorized",
        },
      });

      handleApiError(axiosError, { onShowError });

      expect(onShowError).not.toHaveBeenCalled();
    });
  });
});
