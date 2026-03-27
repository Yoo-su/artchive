"use client";

import { NEOGULIP_TEXTS } from "@bookjeok/core/llm";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { ChatBubble } from "@/features/recommend/components/widgets/chat-bubble";
import { useRecommendStore } from "@/features/recommend/stores/recommend-store";

interface MessageListProps {
  isPending: boolean;
}

const LoadingIndicator = () => {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const messages = NEOGULIP_TEXTS.LOADING_MESSAGES;

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % messages.length;
      const fullText = messages[i];

      setText(
        isDeleting
          ? fullText.substring(0, text.length - 1)
          : fullText.substring(0, text.length + 1),
      );

      setTypingSpeed(isDeleting ? 30 : 100);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 1500); // 1.5s wait before deleting
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, messages]);

  return (
    <div className="flex w-full justify-start animate-fade-in pl-2">
      <div className="flex items-center space-x-3 bg-white border border-neogulip-border px-5 py-3.5 rounded-2xl rounded-tl-none shadow-sm min-h-[52px]">
        {/* Raccoon Icon */}
        <div className="text-xl animate-bounce">🦝</div>
        {/* Typewriter Text */}
        <div className="flex items-center">
          <motion.span
            key={loopNum}
            className="text-sm text-neogulip-brown-primary font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {text}
            <span className="animate-pulse ml-0.5 text-neogulip-primary">
              |
            </span>
          </motion.span>
        </div>
      </div>
    </div>
  );
};

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
      {isPending && <LoadingIndicator />}
    </div>
  );
};
