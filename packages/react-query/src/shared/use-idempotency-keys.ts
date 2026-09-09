"use client";

import { useCallback, useRef } from "react";

/**
 * 주문·거래처럼 재시도가 부작용을 낳는 뮤테이션에 붙일 멱등성 키를 발급합니다.
 *
 * 대상(주문 ID, 판매글 ID 등)별로 키를 보관하는 것이 요점입니다. 훅 하나로
 * 키를 돌려쓰면 목록 화면처럼 같은 훅 인스턴스가 여러 대상을 처리할 때
 * A의 응답이 B에게 재생됩니다.
 *
 * 성공해야 키를 버립니다. 실패는 응답을 못 받은 경우를 포함하는데, 그때
 * 같은 키로 다시 보내야 서버가 처음 응답을 그대로 돌려줍니다. 실패 시
 * 키를 새로 뽑으면 이미 반영된 요청이 한 번 더 실행됩니다.
 */
export const useIdempotencyKeys = () => {
  const keys = useRef(new Map<string, string>());

  /**
   * 대상의 멱등성 키를 가져옵니다. 없으면 새로 만듭니다.
   * @param target 대상 식별자
   * @returns 멱등성 키
   */
  const issue = useCallback((target: string) => {
    const existing = keys.current.get(target);
    if (existing) return existing;

    const key = crypto.randomUUID();
    keys.current.set(target, key);
    return key;
  }, []);

  /**
   * 대상의 멱등성 키를 버립니다. 다음 요청은 새 키를 받습니다.
   * @param target 대상 식별자
   */
  const release = useCallback((target: string) => {
    keys.current.delete(target);
  }, []);

  return { issue, release };
};
