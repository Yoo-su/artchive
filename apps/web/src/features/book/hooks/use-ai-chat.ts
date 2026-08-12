"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import {
  CHAT_STORAGE_KEY,
  ChatMessage,
  INITIAL_WELCOME_MESSAGE,
} from "../constants/ai-chat";
import { streamAiChat } from "../utils/sse-chat-client";

export const useAiChat = () => {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 실크 스무딩 버퍼 (Smooth Token Pacing Queue) Refs
  const streamTargetTextRef = useRef("");
  const streamDisplayedLengthRef = useRef(0);
  const isStreamDoneRef = useRef(false);
  const activeAiMessageIdRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);

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

  // RAF 기반 부드러운 토큰 드레인 러너
  const startSmoothDrain = useCallback(() => {
    if (rafIdRef.current) return;

    let lastTick = performance.now();

    const tick = (now: number) => {
      const target = streamTargetTextRef.current;
      const currentLength = streamDisplayedLengthRef.current;
      const diff = target.length - currentLength;
      const aiId = activeAiMessageIdRef.current;

      if (diff > 0 && aiId) {
        const elapsed = now - lastTick;
        // ~60fps 주기로 프레임마다 자연스러운 속도로 글자 증가
        if (elapsed >= 16) {
          lastTick = now;
          let step = 1;
          if (diff > 60) step = Math.ceil(diff / 6);
          else if (diff > 25) step = Math.ceil(diff / 10);
          else if (diff > 10) step = 2;
          else step = 1;

          const nextLength = Math.min(currentLength + step, target.length);
          streamDisplayedLengthRef.current = nextLength;
          const sliceText = target.slice(0, nextLength);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiId ? { ...msg, content: sliceText } : msg,
            ),
          );
        }
      }

      // 네트워크 스트림이 끝났고, 버퍼도 모두 출력 완료되었을 때
      if (isStreamDoneRef.current && diff <= 0) {
        if (aiId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiId
                ? {
                    ...msg,
                    isStreaming: false,
                    content: streamTargetTextRef.current || msg.content,
                  }
                : msg,
            ),
          );
        }
        setLoading(false);
        rafIdRef.current = null;
        activeAiMessageIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  // 언마운트 시 RAF 정리
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

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

  // 대화 변경 시 sessionStorage 동기화 (단, 스트리밍 중인 플래그는 제거 후 저장)
  useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      const cleanMessages = messages.map(({ isStreaming, ...rest }) => rest);
      sessionStorage.setItem(userStorageKey, JSON.stringify(cleanMessages));
    }
  }, [messages, userStorageKey, loading]);

  // 대화창 내부 스크롤 (스트리밍 중에는 RAF 기반 즉시 추적하여 버벅임/지터 완전 제거)
  const scrollToBottom = useCallback((smooth = false) => {
    if (!chatContainerRef.current) return;
    const container = chatContainerRef.current;

    // 사용자가 위로 스크롤해서 이전 대화를 보고 있는 경우 강제 스크롤 방지
    const isNearBottom =
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight <=
      180;

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  // 대화 및 세션 초기화
  const handleClearChat = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    streamTargetTextRef.current = "";
    streamDisplayedLengthRef.current = 0;
    isStreamDoneRef.current = false;
    activeAiMessageIdRef.current = null;

    setMessages([INITIAL_WELCOME_MESSAGE]);
    setInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(userStorageKey);
    }
  }, [userStorageKey]);

  // 메시지 전송 (SSE 스트리밍 + 토큰 페이싱 큐)
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
      const aiMessageId = `ai-${Date.now()}`;
      const placeholderAiMessage: ChatMessage = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      // 버퍼 상태 초기화
      streamTargetTextRef.current = "";
      streamDisplayedLengthRef.current = 0;
      isStreamDoneRef.current = false;
      activeAiMessageIdRef.current = aiMessageId;

      setMessages([...updatedMessages, placeholderAiMessage]);
      setInput("");
      setLoading(true);

      const accessToken = useAuthStore.getState().accessToken;

      try {
        const payloadMessages = updatedMessages
          .filter((m) => m.content && m.content.trim().length > 0)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        await streamAiChat({
          messages: payloadMessages,
          accessToken,
          onBooks: (books) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, books } : msg,
              ),
            );
          },
          onChunk: (chunk) => {
            streamTargetTextRef.current += chunk;
            startSmoothDrain();
          },
          onDone: () => {
            isStreamDoneRef.current = true;
            startSmoothDrain();
          },
          onError: (errMsg) => {
            isStreamDoneRef.current = true;
            streamTargetTextRef.current = errMsg;
            startSmoothDrain();
          },
        });
      } catch (error: any) {
        console.error("AI Chat Request Failed:", error);
        isStreamDoneRef.current = true;
        const isUnauthorized =
          error?.message === "UNAUTHORIZED" || error?.response?.status === 401;
        streamTargetTextRef.current = isUnauthorized
          ? "AI 도서 추천 기능은 로그인 후 이용하실 수 있는 회원 전용 서비스입니다."
          : "죄송합니다, 대화를 처리하는 중 일시적인 오류가 발생했습니다. 다시 말씀해 주시겠어요?";
        startSmoothDrain();
      }
    },
    [input, isLoggedIn, loading, messages, startSmoothDrain],
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
