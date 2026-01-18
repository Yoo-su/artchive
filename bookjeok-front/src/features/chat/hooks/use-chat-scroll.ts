"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { ChatMessage } from "../types";

interface UseChatScrollProps {
  messages: ChatMessage[];
  hasPreviousPage: boolean;
  isFetchingPreviousPage: boolean;
  fetchPreviousPage: () => void;
}

/**
 * 채팅 스크롤 관리를 위한 커스텀 훅입니다.
 * - 이전 메시지 로드 시 스크롤 위치 유지
 * - 새 메시지 도착 시 자동 스크롤
 * - 무한 스크롤 핸들러 제공
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
