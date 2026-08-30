"use client";

import { recordBookView } from "@bookjeok/api-client";
import { useEffect, useRef } from "react";

/**
 * 책 상세페이지 조회수를 기록하는 훅 (부수효과 고립)
 * - 컴포넌트 마운트 및 ISBN 변경 시 호출
 * - StrictMode 상에서의 중복 호출 및 페이지 내 도서 이동 시 중복 누락 버그 해결
 * - IP 기반 24시간 중복 방지는 백엔드에서 처리
 * @param isbn 책 ISBN
 */
export const useBookView = (isbn: string) => {
  const lastCalledIsbnRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isbn || lastCalledIsbnRef.current === isbn) {
      return;
    }

    lastCalledIsbnRef.current = isbn;

    // 조회수 기록 API 호출 (실패해도 무시)
    recordBookView(isbn).catch((error) => {
      console.warn("책 조회수 기록 실패:", error);
    });
  }, [isbn]);
};
