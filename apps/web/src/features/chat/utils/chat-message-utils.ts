import { ChatMessage } from "@bookjeok/core";

/**
 * 메시지에 첨부된 이미지 URL을 추출합니다.
 * metadata는 jsonb라 타입이 보장되지 않으므로 방어적으로 파싱합니다.
 */
export const getMessageImageUrls = (message: ChatMessage): string[] => {
  const urls = (message.metadata as { imageUrls?: unknown } | null | undefined)
    ?.imageUrls;
  if (!Array.isArray(urls)) return [];
  return urls.filter((url): url is string => typeof url === "string");
};

/** 메시지에 표시할 텍스트 본문이 있는지 여부 */
export const hasMessageText = (message: ChatMessage): boolean =>
  message.content.trim().length > 0;

/**
 * 무한 쿼리 페이지를 시간 오름차순 배열로 평탄화합니다.
 * 페이지 배열은 과거 → 최신, 페이지 내부는 서버 DESC로 최신이 먼저 오므로
 * 페이지 단위로 뒤집어 이어 붙이면 전체 정렬 없이 시간순이 됩니다.
 */
export const flattenChatMessages = (
  pages: { messages: ChatMessage[] }[] | undefined,
): ChatMessage[] => {
  if (!pages) return [];
  const result: ChatMessage[] = [];
  for (const page of pages) {
    for (let i = page.messages.length - 1; i >= 0; i--) {
      result.push(page.messages[i]);
    }
  }
  return result;
};

/** 메시지 본문을 링크와 일반 텍스트로 나눈 조각 */
export type MessageTextSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

// http(s):// 또는 www. 로 시작하는 토큰만 링크로 인정
const URL_PATTERN = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
// 링크에 딸려 들어가는 문장 끝 문장부호 제거용
const TRAILING_PUNCTUATION = /[.,!?;:'"]+$/;

/** 링크 뒤에 붙은 문장부호와 짝 없는 닫는 괄호 제거 */
const trimUrlTail = (url: string): string => {
  let trimmed = url.replace(TRAILING_PUNCTUATION, "");

  while (
    trimmed.endsWith(")") &&
    trimmed.split(")").length > trimmed.split("(").length
  ) {
    trimmed = trimmed.slice(0, -1).replace(TRAILING_PUNCTUATION, "");
  }

  return trimmed;
};

/** 메시지 본문을 링크와 텍스트 조각으로 분리합니다. */
export const splitTextWithLinks = (text: string): MessageTextSegment[] => {
  const segments: MessageTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const url = trimUrlTail(raw);

    // 문장부호만 남은 경우는 링크로 취급하지 않음
    if (!url || url === "www.") continue;

    if (start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, start) });
    }

    segments.push({
      type: "link",
      value: url,
      href: url.startsWith("www.") ? `https://${url}` : url,
    });

    lastIndex = start + url.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
};
