import { AiSearchBookItem } from "@bookjeok/core";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  books?: AiSearchBookItem[];
  isStreaming?: boolean;
  statusMessage?: string;
}



export const CHAT_STORAGE_KEY = "bookjeok_ai_chat_history";

export const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: "initial-welcome",
  role: "assistant",
  content:
    "안녕하세요! 어떤 책을 찾고 계신가요? 마음속 고민이나 읽고 싶은 분위기, 선호하는 장르를 편안하게 말씀해 주시면 꼭 맞는 책을 찾아드릴게요.",
};

export const AI_CHAT_SUGGESTION_CHIPS = [
  "요즘 너무 지치고 마음이 무거워요",
  "주말에 몰입해서 읽을 단편 소설",
  "삶의 태도에 대해 조언을 주는 에세이",
  "퇴근길 가볍게 읽기 좋은 책",
] as const;
