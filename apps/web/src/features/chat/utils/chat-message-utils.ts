import { ChatMessage } from "@bookjeok/core";

/**
 * 메시지에 첨부된 이미지 URL을 추출합니다.
 *
 * metadata는 jsonb로 저장되어 타입이 보장되지 않으므로 방어적으로 파싱합니다.
 */
export const getMessageImageUrls = (message: ChatMessage): string[] => {
  const urls = (message.metadata as { imageUrls?: unknown } | null | undefined)
    ?.imageUrls;
  if (!Array.isArray(urls)) return [];
  return urls.filter((url): url is string => typeof url === "string");
};

/** 메시지에 표시할 텍스트 본문이 있는지 확인합니다. */
export const hasMessageText = (message: ChatMessage): boolean =>
  message.content.trim().length > 0;

/**
 * 무한 쿼리 페이지들을 화면에 뿌릴 시간 오름차순 배열로 폅니다.
 *
 * 페이지 배열은 과거 → 최신 순이고, 각 페이지 안에서는 서버가 DESC로 내려주어
 * 최신이 먼저 옵니다. 그래서 페이지마다 뒤집어 이어 붙이면 전체가 시간순이 되며,
 * 메시지가 도착할 때마다 전체를 정렬할 필요가 없습니다.
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

// http(s):// 로 시작하거나 www. 로 시작하는 토큰만 링크로 인정합니다.
const URL_PATTERN = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
// 문장 끝 문장부호가 링크에 딸려 들어가지 않도록 잘라냅니다.
const TRAILING_PUNCTUATION = /[.,!?;:'"]+$/;

/** 링크 뒤에 붙은 문장부호와 짝 없는 닫는 괄호를 떼어냅니다. */
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

/**
 * 메시지 본문을 링크와 텍스트 조각으로 나눕니다.
 * 렌더링 쪽에서 링크 조각만 앵커로 감싸면 됩니다.
 */
export const splitTextWithLinks = (text: string): MessageTextSegment[] => {
  const segments: MessageTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const url = trimUrlTail(raw);

    // 문장부호만 남은 경우는 링크로 보지 않습니다.
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
