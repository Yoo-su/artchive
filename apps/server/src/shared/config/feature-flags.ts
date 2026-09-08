/**
 * 결제·주문 기능 활성화 여부.
 *
 * PG 심사 전에도 결제 코드를 배포한 채 진입만 막기 위한 플래그입니다.
 * 예전에는 세 곳이 각자 `process.env`와 `ConfigService`를 섞어 읽어서,
 * 한쪽만 켜지는 상태가 만들어질 수 있었습니다. 판단은 여기 한 곳에서만 합니다.
 *
 * `ConfigModule`이 `.env`를 `process.env`에 실어주므로 여기서 직접 읽어도
 * ConfigService와 같은 값을 봅니다.
 */
export const isPaymentEnabled = (): boolean =>
  process.env.FEATURE_PAYMENT_ENABLED === 'true';
