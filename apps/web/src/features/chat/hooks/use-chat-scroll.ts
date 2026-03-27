"use client";

import { ChatMessage } from "@bookjeok/core/chat";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface UseChatScrollProps {
  messages: ChatMessage[];
  hasPreviousPage: boolean;
  isFetchingPreviousPage: boolean;
  fetchPreviousPage: () => void;
}

/**
 * 채팅 스크롤 관리를 위한 커스텀 훅입니다.
 * - 이전 메시지 로드 시 위치 유지: 무한 스크롤로 과거 메시지를 불러올 때, 현재 보고 있던 스크롤 위치를 유지합니다.
 * - 자동 스크롤: 새로운 메시지가 도착하거나 전송됐을 때 자동으로 맨 아래로 스크롤합니다.
 * - 무한 스크롤 트리거: 스크롤이 상단에 닿았을 때 fetchPreviousPage를 호출합니다.
 */
export const useChatScroll = ({
  messages,
  hasPreviousPage,
  isFetchingPreviousPage,
  fetchPreviousPage,
}: UseChatScrollProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<{ scrollHeight: number } | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  // 이전 메시지 로드 시 스크롤 위치 유지
  useLayoutEffect(() => {
    if (scrollRef.current && messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight -
        scrollRef.current.scrollHeight;
      scrollRef.current = null;
    }
  }, [messages]);

  // 새 메시지 도착 시 자동 스크롤
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id !== lastMessageIdRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      lastMessageIdRef.current = lastMessage.id;
    }
  }, [messages]);

  // 스크롤 이벤트 핸들러 (이전 메시지 로드)
  const handleScroll = useCallback(() => {
    if (
      messageContainerRef.current?.scrollTop === 0 &&
      hasPreviousPage &&
      !isFetchingPreviousPage
    ) {
      scrollRef.current = {
        scrollHeight: messageContainerRef.current.scrollHeight,
      };
      fetchPreviousPage();
    }
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  return {
    messagesEndRef,
    messageContainerRef,
    handleScroll,
  };
};
