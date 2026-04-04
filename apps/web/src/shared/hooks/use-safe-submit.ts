import { useCallback, useRef } from "react";

/**
 * 프론트엔드에서의 더블 클릭 및 중복 제출을 방지하는 커스텀 훅입니다.
 * 내부적으로 Lock(useRef)을 관리하며, 매 호출마다 고유한 uuid를 생성해 Idempotency-Key로 반환합니다.
 */
export const useSafeSubmit = () => {
  const isSubmitting = useRef(false);

  /**
   * API 호출과 같은 비동기 함수를 래핑합니다.
   * 첫 번째 인자로 전달되는 콜백은 (idempotencyKey: string) => Promise<any> 형태여야 합니다.
   */
  const executeSafeSubmit = useCallback(
    async <T>(
      submitCallback: (idempotencyKey: string) => Promise<T>,
    ): Promise<T | void> => {
      if (isSubmitting.current) {
        console.warn("이미 처리 중인 요청입니다. 중복 제출을 방지합니다.");
        return;
      }

      isSubmitting.current = true;
      const idempotencyKey = crypto.randomUUID(); // 고유 트랜잭션 키 생성

      // 1) UI Overlay (전역 마우스 이벤트 차단)
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = "none";
      }

      try {
        // 락을 걸고 콜백 수행
        return await submitCallback(idempotencyKey);
      } finally {
        isSubmitting.current = false; // 폼이 닫히지 않는 댓글 등의 연속 작성을 위해 반드시 락 해제
        // 완료(상태 처리나 라우팅 등) 후에는 다른 버튼들도 조작할 수 있도록 전역 마우스 이벤트 복원
        if (typeof document !== "undefined") {
          document.body.style.pointerEvents = "";
        }
      }
    },
    [],
  );

  return { executeSafeSubmit };
};
