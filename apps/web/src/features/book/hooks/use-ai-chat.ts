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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // sessionStorage 동기화 초기값 로딩
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
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

  // sessionStorage 저장 동기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // 메시지 하단 스크롤
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // 대화 및 세션 초기화
  const handleClearChat = useCallback(() => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }, []);

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
    messagesEndRef,
    handleSendMessage,
    handleClearChat,
  };
};
