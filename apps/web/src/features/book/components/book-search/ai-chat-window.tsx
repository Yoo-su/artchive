"use client";

import { motion } from "framer-motion";
import { Loader2, RotateCcw, Send } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import remarkGfm from "remark-gfm";

import { Input } from "@/shared/components/shadcn/input";

import { AI_CHAT_SUGGESTION_CHIPS, ChatMessage } from "../../constants/ai-chat";
import { useAiChat } from "../../hooks/use-ai-chat";
import { AiBookRecommendSlider } from "./ai-book-recommend-slider";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
});

export const AiChatWindow = () => {
  const {
    isLoggedIn,
    messages,
    input,
    setInput,
    loading,
    chatContainerRef,
    handleSendMessage,
    handleClearChat,
  } = useAiChat();

  return (
    <div className="w-full bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col h-[680px]">
      {/* 1. 헤더 */}
      <div className="px-5 py-3.5 bg-stone-50/70 border-b border-stone-200/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isLoggedIn ? "bg-emerald-500" : "bg-stone-300"
            }`}
          />
          <h2 className="text-xs sm:text-sm font-medium text-stone-800">
            대화형 AI 도서 추천
          </h2>
          {!isLoggedIn && (
            <span className="text-[11px] text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
              회원 전용
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1 text-xs text-stone-500 hover:text-stone-900 border border-stone-200 rounded-md bg-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>대화 초기화</span>
        </button>
      </div>

      {/* 2. 대화 타임라인 (내부 독립 스크롤 & overscroll-contain) */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4"
      >
        {messages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`px-4 py-3 max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-stone-800 text-white rounded-2xl rounded-tr-xs whitespace-pre-line"
                  : "bg-stone-50 border border-stone-200 text-stone-800 rounded-2xl rounded-tl-xs"
              }`}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    strong: ({ node, ...props }) => (
                      <strong
                        {...props}
                        className="font-semibold text-stone-900"
                      />
                    ),
                    em: ({ node, ...props }) => (
                      <em {...props} className="italic text-stone-800" />
                    ),
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        className="underline font-medium text-emerald-600 hover:text-emerald-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        {...props}
                        className="list-disc pl-5 space-y-1 my-1.5"
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        {...props}
                        className="list-decimal pl-5 space-y-1 my-1.5"
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p {...props} className="mb-1.5 last:mb-0 leading-relaxed" />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>

            {msg.books && <AiBookRecommendSlider books={msg.books} />}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
            <span>도서 추천을 분석 중입니다...</span>
          </div>
        )}
      </div>

      {/* 3. 비로그인 안내 */}
      {!isLoggedIn && (
        <div className="mx-4 sm:mx-6 my-2 p-3 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <span className="text-stone-600">
            AI 도서 추천은 로그인 후 이용하실 수 있습니다.
          </span>
          <Link
            href="/auth/login"
            className="px-3 py-1.5 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 transition-colors shrink-0"
          >
            로그인하기
          </Link>
        </div>
      )}

      {/* 4. 대화 추천 칩 */}
      {isLoggedIn && messages.length <= 2 && (
        <div className="px-4 sm:px-6 py-2 flex flex-wrap gap-1.5 bg-stone-50/50 border-t border-stone-100">
          {AI_CHAT_SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={`chip-${idx}`}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1 text-xs text-stone-600 bg-white border border-stone-200 rounded-full hover:border-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* 5. 입력 폼 */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isLoggedIn
                ? "어떤 도서를 찾고 계신가요?"
                : "로그인 후 이용 가능합니다."
            }
            disabled={!isLoggedIn || loading}
            className="w-full pl-4 pr-12 h-11 text-base sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-400 transition-all placeholder:text-stone-400 disabled:bg-stone-100 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!isLoggedIn || !input.trim() || loading}
            className="absolute right-2 w-7 h-7 bg-stone-800 hover:bg-stone-900 text-white rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="메시지 전송"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
