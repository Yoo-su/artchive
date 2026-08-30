"use client";

import { recordReviewView } from "@bookjeok/api-client";
import { useEffect, useRef } from "react";

/**
 * 리뷰 상세페이지 조회수를 기록하는 훅
 * - 컴포넌트 마운트 시 한 번만 호출
 * - IP 기반 24시간 중복 방지는 백엔드에서 처리
 * @param reviewId 리뷰 ID
 */
export const useReviewView = (reviewId: number) => {
  const hasCalledRef = useRef(false);

  useEffect(() => {
    // StrictMode에서 두 번 호출되는 것 방지
    if (hasCalledRef.current || !reviewId) {
      return;
    }

    hasCalledRef.current = true;

    // 조회수 기록 API 호출 (실패해도 무시)
    recordReviewView(reviewId).catch((error) => {
      // 조회수 기록 실패는 사용자 경험에 영향 없으므로 조용히 무시
      console.warn("리뷰 조회수 기록 실패:", error);
    });
  }, [reviewId]);
};
