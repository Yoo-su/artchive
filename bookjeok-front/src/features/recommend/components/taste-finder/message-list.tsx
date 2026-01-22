"use client";

import { useEffect, useRef } from "react";

import { ChatBubble } from "@/features/recommend/components/chat-bubble";
import { useRecommendStore } from "@/features/recommend/stores/recommend-store";

interface MessageListProps {
  isPending: boolean;
}

export const TasteFinderMessageList = ({ isPending }: MessageListProps) => {
  const { messages } = useRecommendStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 스크롤 자동 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      ref={scrollRef}
    >
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg.text} isAi={msg.isAi} />
      ))}
      {isPending && (
        <div className="flex w-full justify-start animate-fade-in pl-2">
          <div className="flex items-center space-x-1.5 bg-white border border-neogulip-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
            <div className="w-1.5 h-1.5 bg-neogulip-brown-light rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-neogulip-brown-light rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-neogulip-brown-light rounded-full animate-bounce"></div>
          </div>
        </div>
      )}
    </div>
  );
};
