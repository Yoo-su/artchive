"use client";

import { motion } from "framer-motion";
import { Loader2, Lock, LogIn, RotateCcw, Send } from "lucide-react";
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
    messagesEndRef,
    handleSendMessage,
    handleClearChat,
  } = useAiChat();

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-stone-200/80 shadow-xl shadow-stone-200/30 overflow-hidden flex flex-col h-[700px] sm:h-[760px]">
      {/* 1. 대화 헤더 */}
      <div className="px-4 sm:px-6 py-3.5 bg-stone-50/90 border-b border-stone-200/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isLoggedIn ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <h2 className="text-xs sm:text-sm font-semibold text-stone-800 truncate">
            대화형 AI 도서 큐레이션
          </h2>
          {!isLoggedIn && (
            <span className="text-[10px] sm:text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
              회원 전용
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-full hover:border-stone-400 hover:text-stone-900 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
          title="대화 내역 및 맥락 초기화"
        >
          <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>대화 초기화</span>
        </button>
      </div>

      {/* 2. 대화 타임라인 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
        {messages.map((msg: ChatMessage) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* 메시지 버블 (마크다운 파싱) */}
            <div
              className={`px-4 sm:px-5 py-3 sm:py-3.5 max-w-[90%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-stone-900 text-white rounded-2xl rounded-tr-xs font-light shadow-xs whitespace-pre-line"
                  : "bg-stone-50/90 border border-stone-200/80 text-stone-800 rounded-2xl rounded-tl-xs shadow-xs"
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
                        className="list-disc pl-5 space-y-1.5 my-2"
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        {...props}
                        className="list-decimal pl-5 space-y-1.5 my-2"
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p {...props} className="mb-2 last:mb-0 leading-relaxed" />
                    ),
                    code: ({ node, ...props }) => (
                      <code
                        {...props}
                        className="bg-stone-200/70 text-stone-900 px-1.5 py-0.5 rounded text-xs font-mono"
                      />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>

            {/* AI 추천 도서 Swiper 캐러셀 */}
            {msg.books && <AiBookRecommendSlider books={msg.books} />}
          </motion.div>
        ))}

        {/* 로딩 인디케이터 */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-stone-400 text-xs py-2"
          >
            <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
            <span>대화를 분석하고 DB에서 맞춤 서사를 탐색 중입니다...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. 비로그인 유저 안내 배너 */}
      {!isLoggedIn && (
        <div className="mx-4 sm:mx-6 my-2 p-3.5 sm:p-4 bg-stone-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                AI 도서 큐레이션은 회원 전용 서비스입니다
              </h4>
              <p className="text-[11px] text-stone-300 mt-0.5">
                로그인 후 실시간 문맥 분석 및 768차원 맞춤 도서 추천을 이용해 보세요.
              </p>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>로그인하러 가기</span>
          </Link>
        </div>
      )}

      {/* 4. 대화 추천 칩 (대화 초기 단계 노출) */}
      {isLoggedIn && messages.length <= 2 && (
        <div className="px-4 sm:px-6 py-2 flex flex-wrap gap-1.5 sm:gap-2 bg-stone-50/40 border-t border-stone-100">
          {AI_CHAT_SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={`chip-${idx}`}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-full hover:border-stone-400 hover:text-stone-900 transition-colors shadow-2xs cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* 5. 하단 입력 폼 */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-stone-200/70">
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
                ? "마음속 생각이나 어떤 책을 읽고 싶은지 자유롭게 적어보세요..."
                : "AI 도서 추천 기능은 로그인 후 이용하실 수 있습니다."
            }
            disabled={!isLoggedIn || loading}
            className="w-full pl-4 sm:pl-5 pr-12 sm:pr-14 h-12 sm:h-13 text-xs sm:text-sm font-light bg-stone-50/70 border border-stone-200 rounded-full focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all placeholder:text-stone-400 disabled:bg-stone-100/70 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!isLoggedIn || !input.trim() || loading}
            className="absolute right-2 sm:right-2.5 w-8 h-8 sm:w-9 sm:h-9 bg-stone-900 hover:bg-stone-800 text-white rounded-full flex items-center justify-center disabled:opacity-40 disabled:hover:bg-stone-900 transition-all cursor-pointer"
            aria-label="메시지 전송"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
