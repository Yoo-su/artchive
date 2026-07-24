"use client";

import { publicApiClient } from "@bookjeok/api-client";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { BookCard } from "@/features/book/components/common/book-card";
import { AiSearchBookItem } from "@/features/book/queries/use-ai-search-query";
import { Input } from "@/shared/components/shadcn/input";
import { API_PATHS } from "@/shared/constants/apis";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  books?: AiSearchBookItem[];
}

export const AiChatWindow = () => {
  const t = useTranslations("book.search");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        "안녕하세요! 어떤 책을 찾고 계신가요? 마음속 고민이나 읽고 싶은 분위기, 선호하는 장르를 편안하게 말씀해 주시면 꼭 맞는 책을 찾아드릴게요.",
    },
  ]);

  // 추천 질의 칩 목록
  const suggestionChips = [
    "요즘 너무 지치고 마음이 무거워요",
    "주말에 몰입해서 읽을 단편 소설",
    "삶의 태도에 대해 조언을 주는 에세이",
    "퇴근길 가볍게 읽기 좋은 책",
  ];

  // 메시지 추가 시 하단 스크롤 자동 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 메시지 전송 핸들러
  const handleSendMessage = async (textToSend?: string) => {
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
      // 백엔드로 전체 대화 히스토리 전송
      const payload = {
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };

      const response = await publicApiClient.post<{
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
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          error?.response?.data?.message ||
          "죄송합니다, 대화를 처리하는 중 일시적인 오류가 발생했습니다. 다시 말씀해 주시겠어요?",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-stone-200/80 shadow-xl shadow-stone-200/30 overflow-hidden flex flex-col h-[750px]">
      {/* 1. 대화 헤더 */}
      <div className="px-6 py-4 bg-stone-50/90 border-b border-stone-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-stone-800">
            대화형 AI 도서 큐레이션
          </h2>
        </div>
        <span className="text-xs text-stone-400">
          실시간 문맥 대화 & RAG 맞춤 추천
        </span>
      </div>

      {/* 2. 대화 메시지 타임라인 영역 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* 메시지 버블 (AI RAG 총평 및 안내) */}
            <div
              className={`px-5 py-3.5 max-w-[85%] text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-stone-900 text-white rounded-2xl rounded-tr-xs font-light shadow-xs"
                  : "bg-stone-50/90 border border-stone-200/80 text-stone-800 rounded-2xl rounded-tl-xs shadow-xs"
              }`}
            >
              {msg.content}
            </div>

            {/* AI 추천 도서 카드 및 RAG 개별 추천 사유 (추천 결과가 포함된 경우) */}
            {msg.books && msg.books.length > 0 && (
              <div className="mt-4 w-full bg-stone-50/50 border border-stone-200/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200/50 pb-2">
                  <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                    AI 맞춤 추천 도서 ({msg.books.length}권)
                  </span>
                  <span className="text-[11px] text-stone-400">
                    pgvector 의미 검색 + RAG 큐레이션
                  </span>
                </div>

                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {msg.books.map((book) => (
                    <div
                      key={book.isbn}
                      className="bg-white border border-stone-200/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3 shadow-xs hover:border-stone-300 transition-all"
                    >
                      <BookCard
                        book={{
                          isbn: book.isbn,
                          title: book.title,
                          author: book.author,
                          publisher: book.publisher,
                          description: book.description,
                          image: book.image,
                          discount: "",
                          link: "",
                          pubdate: "",
                        }}
                      />

                      {/* RAG 개별 도서 추천 사유 */}
                      {book.reason && (
                        <div className="p-2.5 bg-stone-50 rounded-lg text-xs text-stone-600 leading-snug border border-stone-100">
                          <span className="font-medium text-stone-800 block mb-1">
                            추천 까닭
                          </span>
                          {book.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* 3. 대화 시작 추천 칩 (대화 초기 단계일 때 노출) */}
      {messages.length <= 2 && (
        <div className="px-6 py-2 flex flex-wrap gap-2 bg-stone-50/40 border-t border-stone-100">
          {suggestionChips.map((chip, idx) => (
            <button
              key={`chip-${idx}`}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-full hover:border-stone-400 hover:text-stone-900 transition-colors shadow-2xs cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* 4. 하단 입력 폼 */}
      <div className="p-4 bg-white border-t border-stone-200/70">
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
            placeholder="마음속 생각이나 어떤 책을 읽고 싶은지 자유롭게 적어보세요..."
            disabled={loading}
            className="w-full pl-5 pr-14 h-13 text-sm font-light bg-stone-50/70 border border-stone-200 rounded-full focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all placeholder:text-stone-400"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2.5 w-9 h-9 bg-stone-900 hover:bg-stone-800 text-white rounded-full flex items-center justify-center disabled:opacity-40 disabled:hover:bg-stone-900 transition-all cursor-pointer"
            aria-label="메시지 전송"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
