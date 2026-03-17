import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ERROR_CODES } from '../exceptions/error-codes';

/**
 * 표준화된 에러 응답 인터페이스
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    path: string;
  };
}

/**
 * 전역 예외 필터
 *
 * 모든 예외를 catch하여 표준화된 형식으로 응답합니다.
 * - BusinessException: 비즈니스 에러 코드 사용
 * - HttpException: NestJS 내장 예외 처리
 * - 기타 예외: 내부 서버 에러로 처리
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    const status = this.getHttpStatus(exception);

    // 에러 로깅 (5xx 에러는 error 레벨, 4xx는 warn 레벨)
    this.logError(exception, request, status);

    response.status(status).json(errorResponse);
  }

  /**
   * 예외 종류에 따라 표준화된 에러 응답을 생성합니다.
   */
  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // 1. BusinessException 처리
    if (exception instanceof BusinessException) {
      const errorInfo = exception.getErrorInfo();
      return {
        success: false,
        error: {
          code: errorInfo.code,
          message: errorInfo.message,
          details: exception.details,
          timestamp,
          path,
        },
      };
    }

    // 2. ValidationPipe에서 발생하는 BadRequestException 처리
    if (exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse();
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR.code,
          message: ERROR_CODES.VALIDATION_ERROR.message,
          details: this.extractValidationDetails(exceptionResponse),
          timestamp,
          path,
        },
      };
    }

    // 3. 기타 HttpException 처리
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      return {
        success: false,
        error: {
          code: this.mapHttpStatusToCode(exception.getStatus()),
          message: this.extractMessage(exceptionResponse),
          timestamp,
          path,
        },
      };
    }

    // 4. 예기치 않은 에러 처리
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR.code,
        message: this.isProduction
          ? ERROR_CODES.INTERNAL_ERROR.message
          : ((exception as Error).message ?? '알 수 없는 오류가 발생했습니다.'),
        timestamp,
        path,
      },
    };
  }

  /**
   * 예외에서 HTTP 상태 코드를 추출합니다.
   */
  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * HTTP 상태 코드를 에러 코드로 매핑합니다.
   */
  private mapHttpStatusToCode(status: number): string {
    const statusCodeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: ERROR_CODES.AUTH_UNAUTHORIZED.code,
      403: ERROR_CODES.AUTH_FORBIDDEN.code,
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: ERROR_CODES.VALIDATION_ERROR.code,
      429: 'TOO_MANY_REQUESTS',
      500: ERROR_CODES.INTERNAL_ERROR.code,
    };

    return statusCodeMap[status] ?? `HTTP_${status}`;
  }

  /**
   * 예외 응답에서 메시지를 추출합니다.
   */
  private extractMessage(exceptionResponse: unknown): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as Record<string, unknown>).message;
      if (typeof message === 'string') {
        return message;
      }
      // ValidationPipe에서 message가 배열인 경우
      if (Array.isArray(message) && message.length > 0) {
        const firstMessage: unknown = message[0];
        return typeof firstMessage === 'string'
          ? firstMessage
          : '요청을 처리할 수 없습니다.';
      }
    }

    return '요청을 처리할 수 없습니다.';
  }

  /**
   * ValidationPipe 에러에서 상세 정보를 추출합니다.
   */
  private extractValidationDetails(
    exceptionResponse: unknown,
  ): Record<string, unknown> | undefined {
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as Record<string, unknown>).message;
      if (Array.isArray(message)) {
        return { errors: message };
      }
    }
    return undefined;
  }

  /**
   * 에러를 로깅합니다.
   */
  private logError(exception: unknown, request: Request, status: number): void {
    const { method, url, body } = request;
    const errorMessage =
      exception instanceof Error ? exception.message : 'Unknown error';

    const logData = {
      method,
      url,
      statusCode: status,
      error: errorMessage,
      // 개발 환경에서만 요청 본문 로깅 (민감 정보 포함 가능)
      ...(this.isProduction ? {} : { body }),
    };

    // 5xx 에러는 error 레벨, 그 외는 warn 레벨
    if (status >= 500) {
      this.logger.error(logData);
      // 스택 트레이스도 함께 로깅 (개발 환경)
      if (!this.isProduction && exception instanceof Error) {
        this.logger.error(exception.stack);
      }
    } else {
      this.logger.warn(logData);
    }
  }
}
