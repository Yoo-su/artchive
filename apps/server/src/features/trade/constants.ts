/**
 * 거래 완료 후 후기를 쓸 수 있는 기간.
 *
 * 완료 화면과 후기 작성 검증이 서로 다른 기한을 쓰면 "쓸 수 있다고 떠 있는데
 * 눌러보면 만료"가 나오므로 한 곳에서만 정의합니다.
 */
export const REVIEW_EXPIRATION_DAYS = 14;
export const REVIEW_EXPIRATION_MS =
  REVIEW_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
