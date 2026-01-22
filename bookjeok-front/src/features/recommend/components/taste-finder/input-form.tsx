"use client";

import { ArrowUp } from "lucide-react";
import { FormEvent } from "react";

import { useRecommendStore } from "@/features/recommend/stores/recommend-store";

interface InputFormProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isPending: boolean;
}

export const TasteFinderInputForm = ({
  input,
  setInput,
  onSubmit,
  isPending,
}: InputFormProps) => {
  const { isFinal } = useRecommendStore();

  return (
    <form
      onSubmit={onSubmit}
      className="p-4 bg-neogulip-bg border-t border-neogulip-bg-accent"
    >
      <div className="relative flex items-center shadow-sm rounded-full bg-white border border-neogulip-bg-accent focus-within:ring-2 focus-within:ring-neogulip-shadow/50 focus-within:border-neogulip-shadow transition-all">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isFinal
              ? "추천이 완료되었습니다. (초기화하여 다시 시작)"
              : "요즘 기분이나 읽고 싶은 책을 말해주세요..."
          }
          disabled={isPending || isFinal}
          className="w-full bg-transparent py-4 pl-6 pr-14 text-[15px] text-neogulip-brown-primary focus:outline-none disabled:opacity-50 placeholder:text-[#BCAAA4]"
        />
        <button
          type="submit"
          disabled={!input.trim() || isPending || isFinal}
          className="absolute right-2 p-2.5 rounded-full bg-neogulip-light text-white transition hover:bg-neogulip-primary disabled:bg-neogulip-border shadow-md hover:shadow-lg transform active:scale-95"
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
};
