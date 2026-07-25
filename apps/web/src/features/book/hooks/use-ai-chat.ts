"use client";

import { privateApiClient } from "@bookjeok/api-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { API_PATHS } from "@/shared/constants/apis";

import {
  CHAT_STORAGE_KEY,
  ChatMessage,
  INITIAL_WELCOME_MESSAGE,
} from "../constants/ai-chat";
import { AiSearchBookItem } from "../queries/use-ai-search-query";

export const useAiChat = () => {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 유저 ID별로 sessionStorage 키를 격리하여 계정 전환 시 대화 기록 혼선 100% 방지
  const userStorageKey = user
    ? `${CHAT_STORAGE_KEY}_user_${user.id}`
    : `${CHAT_STORAGE_KEY}_guest`;

  // initial state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(userStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error("Failed to parse saved chat history:", e);
        }
      }
    }
    return [INITIAL_WELCOME_MESSAGE];
  });

  // 로그인 상태 및 사용자 변경 시 해당 계정의 대화 히스토리 동기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(userStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved chat history:", e);
        }
      }
      setMessages([INITIAL_WELCOME_MESSAGE]);
    }
  }, [userStorageKey]);

  // 대화 변경 시 sessionStorage 동기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(userStorageKey, JSON.stringify(messages));
    }
  }, [messages, userStorageKey]);

  // 대화창 내부만 스크롤 (브라우저 전체 창 튐 방지)
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // 대화 및 세션 초기화
  const handleClearChat = useCallback(() => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(userStorageKey);
    }
  }, [userStorageKey]);

  // 메시지 전송
  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      if (!isLoggedIn) return;

      const queryText = (textToSend || input).trim();
      if (!queryText || loading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: queryText,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setLoading(true);

      try {
        const payload = {
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        };

        const response = await privateApiClient.post<{
          message: string;
          books?: AiSearchBookItem[];
        }>(API_PATHS.search.ai, payload);

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: response.data.message,
          books: response.data.books,
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error: any) {
        console.error("AI Chat Request Failed:", error);
        const isUnauthorized = error?.response?.status === 401;
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: isUnauthorized
            ? "AI 도서 추천 기능은 로그인 후 이용하실 수 있는 회원 전용 서비스입니다."
            : error?.response?.data?.message ||
              "죄송합니다, 대화를 처리하는 중 일시적인 오류가 발생했습니다. 다시 말씀해 주시겠어요?",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [input, isLoggedIn, loading, messages],
  );

  return {
    user,
    isLoggedIn,
    messages,
    input,
    setInput,
    loading,
    chatContainerRef,
    handleSendMessage,
    handleClearChat,
  };
};
