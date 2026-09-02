"use client";

import { ChatMessage } from "@bookjeok/core";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface UseChatScrollProps {
  roomId?: number;
  messages: ChatMessage[];
  hasPreviousPage: boolean;
  isFetchingPreviousPage: boolean;
  fetchPreviousPage: () => void;
}

const BOTTOM_THRESHOLD_PX = 120;

/**
 * 채팅 스크롤 관리 커스텀 훅입니다.
 * - 방 진입/초기 렌더링 시: 즉각 최하단에 정착합니다.
 * - 새 메시지 수신 시: 사용자가 하단 근처에 머물고 있으면 최하단으로 부드럽게 스크롤합니다.
 * - 이전 메시지(과거 페이징) 로드 시: 현재 보고 있던 스크롤 상대 위치를 오차 없이 유지합니다.
 * - 거래 알림 카드/배너 등 비동기 레이아웃 변경 시: ResizeObserver를 통해 하단 고정을 안정적으로 유지합니다.
 * - 위로 스크롤한 동안 도착한 메시지 수를 집계해 하단 이동 단서를 제공합니다.
 */
export const useChatScroll = ({
  roomId,
  messages,
  hasPreviousPage,
  isFetchingPreviousPage,
  fetchPreviousPage,
}: UseChatScrollProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const prevRoomIdRef = useRef<number | undefined>(roomId);
  const prevMessagesLengthRef = useRef<number>(0);
  const isNearBottomRef = useRef<boolean>(true);

  // 하단 근접 여부는 스크롤 중 계속 바뀌므로 ref로 추적하고
  // "맨 아래로" 버튼 표시에 필요한 값만 상태로 승격해 리렌더 최소화
  const [isAtBottom, setIsAtBottom] = useState(true);
  /** 위로 올라가 있는 동안 도착한 새 메시지 수 */
  const [missedMessageCount, setMissedMessageCount] = useState(0);

  // 스크롤을 최하단으로 이동
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messageContainerRef.current;
    if (!container) return;

    isNearBottomRef.current = true;
    setIsAtBottom(true);
    setMissedMessageCount(0);

    if (behavior === "smooth") {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // 1. 방 진입 / 새 메시지 / 이전 메시지 페이징 스크롤 제어
  useLayoutEffect(() => {
    const container = messageContainerRef.current;
    if (!container || messages.length === 0) return;

    const isRoomChanged = prevRoomIdRef.current !== roomId;
    const isInitialLoad = prevMessagesLengthRef.current === 0;
    const isPagingPastMessages = Boolean(scrollRef.current);
    const addedCount = messages.length - prevMessagesLengthRef.current;
    const isNewMessage = addedCount > 0;

    prevRoomIdRef.current = roomId;
    prevMessagesLengthRef.current = messages.length;

    // 1-1. 이전 메시지(상단 페이징) 로드 완료 시: 이전 스크롤 상대 위치 유지
    if (isPagingPastMessages && scrollRef.current) {
      const heightDiff = container.scrollHeight - scrollRef.current.scrollHeight;
      container.scrollTop = scrollRef.current.scrollTop + heightDiff;
      scrollRef.current = null;
      return;
    }

    // 1-2. 방 변경 또는 초기 진입 시: 화면 깜빡임 없이 즉시 최하단 고정
    if (isRoomChanged || isInitialLoad) {
      container.scrollTop = container.scrollHeight;
      isNearBottomRef.current = true;
      setIsAtBottom(true);
      setMissedMessageCount(0);
      return;
    }

    // 1-3. 새 메시지 수신/전송 시: 사용자가 하단 근처에 있으면 최하단으로 스크롤
    if (isNewMessage) {
      if (isNearBottomRef.current) {
        scrollToBottom("smooth");

        // 거래 카드나 동적 요소 비동기 마운트/렌더링 타이밍 보정
        requestAnimationFrame(() => {
          if (isNearBottomRef.current && messageContainerRef.current) {
            scrollToBottom("smooth");
          }
        });
      } else {
        // 위쪽을 보고 있는 동안 쌓인 메시지 수 집계
        setMissedMessageCount((count) => count + addedCount);
      }
    }
  }, [roomId, messages, scrollToBottom]);

  // 2. 거래 카드 비동기 쿼리 로딩, 상단 배너 확장, 폰트/이미지 렌더링 등으로 인한 컨테이너/콘텐츠 리사이즈 감지
  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    // 콜백마다 scrollHeight 읽기/scrollTop 쓰기를 하면 강제 레이아웃이 누적된다
    // (이미지 순차 로드 시 사파리에서 특히 끊김). 한 프레임에 한 번만 처리
    let isScrollPinScheduled = false;
    let rafId: number | null = null;

    const scheduleScrollPin = () => {
      if (isScrollPinScheduled) return;
      isScrollPinScheduled = true;

      rafId = requestAnimationFrame(() => {
        isScrollPinScheduled = false;
        rafId = null;

        // 프레임 대기 중 상태가 바뀌었을 수 있으므로 재확인
        if (scrollRef.current || !isNearBottomRef.current) return;
        const element = messageContainerRef.current;
        if (element) element.scrollTop = element.scrollHeight;
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      // 과거 메시지 로드 중 위치 보정 시에는 리사이즈 옵저버 간섭 방지
      if (scrollRef.current) return;

      if (isNearBottomRef.current) {
        scheduleScrollPin();
      }
    });

    resizeObserver.observe(container);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [messages]);

  // 3. 스크롤 이벤트 핸들러 (상단 도달 시 과거 메시지 요청 및 하단 근접 여부 추적)
  const handleScroll = useCallback(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom <= BOTTOM_THRESHOLD_PX;

    // 값이 실제로 바뀔 때만 상태 갱신 (스크롤 중 리렌더 누적 방지)
    if (nearBottom !== isNearBottomRef.current) {
      setIsAtBottom(nearBottom);
      if (nearBottom) setMissedMessageCount(0);
    }
    isNearBottomRef.current = nearBottom;

    if (
      container.scrollTop <= 10 &&
      hasPreviousPage &&
      !isFetchingPreviousPage
    ) {
      scrollRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      };
      fetchPreviousPage();
    }
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  return {
    messagesEndRef,
    messageContainerRef,
    contentRef,
    handleScroll,
    scrollToBottom,
    isAtBottom,
    missedMessageCount,
  };
};
