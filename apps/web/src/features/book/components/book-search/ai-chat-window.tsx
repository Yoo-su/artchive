"use client";

import { motion } from "framer-motion";
import { RotateCcw, Send, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import remarkGfm from "remark-gfm";

import { Particles } from "@/shared/components/magicui/particles";
import { Input } from "@/shared/components/shadcn/input";
import { Spinner } from "@/shared/components/shadcn/spinner";
import { gowun_batang } from "@/styles/fonts";

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
    <div className="relative w-full bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col h-[680px] overflow-hidden">
      {/* 배경 Particles 효과 */}
      <Particles
        className="z-0 pointer-events-none"
        quantity={35}
        color="#71717a"
        ease={60}
      />

      {/* 1. 헤더 */}
      <div className="relative z-10 px-5 py-3.5 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2
            className={`text-base sm:text-lg font-bold text-stone-800 tracking-tight ${gowun_batang.className}`}
          >
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
        className="relative z-10 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4"
      >
        {messages.map((msg: ChatMessage) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {(msg.content || msg.isStreaming) && (
              <div
                className={`text-xs sm:text-sm leading-relaxed transition-all ${
                  msg.role === "user"
                    ? "bg-stone-900/90 backdrop-blur-md border border-stone-800 text-white rounded-2xl rounded-tr-xs whitespace-pre-line shadow-sm shadow-stone-900/10 px-4 py-3 max-w-[85%] sm:max-w-[75%]"
                    : "bg-white/90 backdrop-blur-md border border-stone-200/80 text-stone-850 rounded-2xl rounded-tl-xs shadow-xs px-4 py-3.5 sm:px-5 sm:py-4 max-w-[92%] sm:max-w-[88%] min-w-[140px] w-fit"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <div className="relative">
                    {/* 스트리밍 단계별 동적 상태 메시지 */}
                    {msg.isStreaming && !msg.content && (
                      <div className="flex items-center gap-2 py-0.5 text-stone-500 text-xs">
                        <Spinner className="size-3.5 text-stone-500" />
                        <span className="text-stone-600 font-medium">
                          {msg.statusMessage || "AI가 답변을 준비하고 있습니다..."}
                        </span>
                      </div>
                    )}

                  {msg.content ? (
                    <div className="prose prose-stone max-w-none text-xs sm:text-sm text-stone-850">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => (
                            <p
                              {...props}
                              className="mb-2 last:mb-0 leading-relaxed text-stone-800"
                            />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong
                              {...props}
                              className="font-semibold text-stone-950"
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
                              className="list-disc pl-5 space-y-1 my-2"
                            />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              {...props}
                              className="list-decimal pl-5 space-y-1 my-2"
                            />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

            {msg.books && msg.books.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <AiBookRecommendSlider books={msg.books} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* 3. 비로그인 안내 */}
      {!isLoggedIn && (
        <div className="relative z-10 mx-4 sm:mx-6 my-2 p-3 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs">
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
        <div className="relative z-10 px-4 sm:px-6 py-2 flex flex-wrap gap-1.5 bg-stone-50/50 border-t border-stone-100">
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
      <div className="relative z-10 p-3.5 sm:p-4 bg-white border-t border-stone-200">
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
