"use client";

/**
 * 서버 ISR 캐시를 비운 뒤 브라우저 Router Cache를 비웁니다.
 *
 * 순서가 중요하다. `router.refresh()`가 먼저 돌면 아직 파괴되지 않은 ISR HTML을
 * 받아와 클라이언트 캐시에 그대로 채우므로, 재검증 완료를 기다린 뒤 새로고침한다.
 *
 * 재검증 실패는 조용히 넘긴다. 뮤테이션 자체는 이미 성공했고 ISR은 만료 시각에
 * 어차피 갱신되므로, 사용자에게 실패로 보여줄 이유가 없다.
 */
export const purgeRouteCache = async (
  revalidate: Promise<unknown>,
  refresh: () => void,
) => {
  try {
    await revalidate;
  } catch (error) {
    console.warn(
      "ISR 재검증 실패 (만료 시각까지 옛 페이지가 노출될 수 있음):",
      error,
    );
  }
  refresh();
};
