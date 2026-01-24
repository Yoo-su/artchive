"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { talkToAiLibrarian } from "../../apis";
import { NEOGULIP_THEME } from "../../constants/neogulip-theme";
import { useRecommendStore } from "../../stores/recommend-store";
import { TasteFinderHeader } from "../finder/taste-finder/header";
import { TasteFinderInputForm } from "../finder/taste-finder/input-form";
import { TasteFinderMessageList } from "../finder/taste-finder/message-list";
import { TasteFinderResultView } from "../finder/taste-finder/result-view";

export function TasteFinderWidget() {
  const { messages, addMessage, setIsFinal, setRecommendedBooks } =
    useRecommendStore();

  const [input, setInput] = useState("");

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (text: string) => {
      // 이전 대화 기록 (최근 10개만)
      const history = messages
        .slice(-10)
        .map((m) => `${m.isAi ? "AI" : "User"}: ${m.text}`)
        .join("\n");
      return talkToAiLibrarian({ message: text, history });
    },
    onSuccess: (data) => {
      addMessage({
        id: Date.now().toString(),
        text: data.message,
        isAi: true,
      });

      if (data.isFinal) {
        setIsFinal(true);
        if (data.recommendedBooks) {
          setRecommendedBooks(data.recommendedBooks);
        }
      }
    },
    onError: () => {
      addMessage({
        id: Date.now().toString(),
        text: NEOGULIP_THEME.TEXTS.ERROR,
        isAi: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    addMessage({
      id: Date.now().toString(),
      text: input,
      isAi: false,
    });

    sendMessage(input);
    setInput("");
  };

  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-neogulip-bg shadow-xl ring-1 ring-black/5 flex flex-col md:flex-row h-[850px] md:h-[600px] transition-all duration-300 hover:shadow-neogulip-shadow/20 my-12">
      {/* 채팅 영역 */}
      <div className="flex flex-col w-full h-[55%] md:h-auto md:w-[55%] border-r border-neogulip-bg-accent bg-neogulip-bg min-h-0 md:min-h-full">
        <TasteFinderHeader setInput={setInput} />
        <TasteFinderMessageList isPending={isPending} />
        <TasteFinderInputForm
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </div>

      {/* 결과 영역 (추천 도서) */}
      <div className="flex-1 bg-white p-6 overflow-y-auto border-l border-neogulip-bg-accent [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <TasteFinderResultView setInput={setInput} />
      </div>
    </div>
  );
}
