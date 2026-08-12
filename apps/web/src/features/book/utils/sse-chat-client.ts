import { API_PATHS } from "@bookjeok/core";

import { AiSearchBookItem } from "../constants/ai-chat";

export interface StreamAiChatOptions {
  messages: { role: string; content: string }[];
  accessToken?: string | null;
  onSearching?: (message: string) => void;
  onBooks?: (books: AiSearchBookItem[]) => void;
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (errorMessage: string) => void;
}

/**
 * AI 대화 및 추천 SSE 엔드포인트와 통신하여 실시간 스트림 이벤트를 파싱하는 네트워크 어댑터
 */
export async function streamAiChat({
  messages,
  accessToken,
  onSearching,
  onBooks,
  onChunk,
  onDone,
  onError,
}: StreamAiChatOptions): Promise<void> {
  const apiBaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const response = await fetch(`${apiBaseURL}${API_PATHS.search.aiStream}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`HTTP Error ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response stream body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const processLine = (rawLine: string) => {
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith("data:")) return;

    const jsonStr = trimmed.replace(/^data:\s*/, "");
    try {
      const data = JSON.parse(jsonStr);

      switch (data.type) {
        case "searching":
          onSearching?.(data.message);
          break;
        case "books":
          if (Array.isArray(data.books)) {
            onBooks?.(data.books);
          }
          break;
        case "text":
          if (data.chunk) {
            onChunk(data.chunk);
          }
          break;
        case "done":
          onDone();
          break;
        case "error":
          onError(data.message || "대화를 처리하는 도중 오류가 발생했습니다.");
          break;
      }
    } catch (e) {
      console.error("Failed to parse SSE JSON chunk:", jsonStr, e);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      processLine(line);
    }
  }

  if (buffer.trim()) {
    processLine(buffer.trim());
  }

  onDone();
}
