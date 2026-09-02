"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * OS 접근성 설정에서 "동작 줄이기"를 켠 사용자를 감지합니다.
 * 캔버스 파티클, 자동 회전 캐러셀처럼 계속 움직이는 연출을 끄는 데 사용합니다.
 *
 * SSR/첫 렌더에서는 항상 false를 반환하므로 하이드레이션 불일치가 발생하지 않습니다.
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(QUERY);
    setPrefersReducedMotion(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
}
