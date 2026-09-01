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
