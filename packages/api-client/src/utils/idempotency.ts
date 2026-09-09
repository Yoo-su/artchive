/** 멱등성 키를 받을 수 있는 API 함수의 공통 옵션. */
export interface IdempotencyOptions {
  idempotencyKey?: string;
}

/**
 * 멱등성 키를 axios 요청 설정으로 바꿉니다.
 *
 * 키가 없으면 `undefined`를 돌려줍니다. 서버의 `IdempotencyInterceptor`는
 * 헤더가 없는 요청을 그대로 통과시키므로, 빈 헤더를 붙이는 것보다 아예
 * 보내지 않는 편이 낫습니다.
 *
 * @param options 멱등성 키가 담긴 옵션
 * @returns axios 요청 설정 또는 undefined
 */
export const withIdempotencyKey = (options?: IdempotencyOptions) =>
  options?.idempotencyKey
    ? { headers: { "x-idempotency-key": options.idempotencyKey } }
    : undefined;
