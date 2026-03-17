import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODES, ErrorCode } from './error-codes';

/**
 * 비즈니스 로직 전용 커스텀 예외
 *
 * 일반 HttpException과 달리, 미리 정의된 에러 코드를 사용하여
 * 일관된 에러 응답 형식을 보장합니다.
 *
 * @example
 * // 기본 사용법
 * throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
 *
 * // 추가 상세 정보 포함
 * throw new BusinessException('VALIDATION_ERROR', HttpStatus.BAD_REQUEST, {
 *   field: 'title',
 *   reason: '제목은 5자 이상이어야 합니다.',
 * });
 */
export class BusinessException extends HttpException {
  /**
   * 에러 코드 키 (ERROR_CODES에 정의된 키)
   */
  public readonly errorCode: ErrorCode;

  /**
   * 추가 상세 정보 (선택적)
   */
  public readonly details?: Record<string, unknown>;

  constructor(
    errorCode: ErrorCode,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Record<string, unknown>,
  ) {
    const errorInfo = ERROR_CODES[errorCode];
    super(errorInfo.message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
  }

  /**
   * 에러 코드 정보를 반환합니다.
   */
  getErrorInfo() {
    return ERROR_CODES[this.errorCode];
  }
}
