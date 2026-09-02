/**
 * 메시지 목록을 만드는 순수 로직 검증.
 *
 * 정렬을 없앤 대신 페이지 구조를 그대로 뒤집어 이어 붙이므로,
 * 페이지 경계에서 순서가 어긋나지 않는지가 핵심입니다.
 */
import { ChatMessage } from "@bookjeok/core";
import { describe, expect, it } from "vitest";

import {
  flattenChatMessages,
  splitTextWithLinks,
} from "@/features/chat/utils/chat-message-utils";

const message = (id: number): ChatMessage => ({
  id,
  content: `메시지 ${id}`,
  isRead: false,
  createdAt: new Date(2026, 0, 1, 0, 0, Math.abs(id)).toISOString(),
  sender: { id: 1, handle: "me", nickname: "나", profileImageUrl: null },
  chatRoom: { id: 1 },
});

describe("flattenChatMessages", () => {
  it("페이지 경계를 넘어 시간 오름차순으로 편다", () => {
    // pages[0]이 가장 오래된 페이지, 각 페이지 안에서는 최신이 먼저 온다
    const pages = [
      { messages: [message(4), message(3)] },
      { messages: [message(2), message(1)] },
    ];

    expect(flattenChatMessages(pages).map((m) => m.id)).toEqual([3, 4, 1, 2]);
  });

  it("최신 페이지 맨 앞에 넣은 낙관적 메시지가 가장 마지막에 온다", () => {
    const pages = [
      { messages: [message(2), message(1)] },
      { messages: [message(-100), message(5)] },
    ];

    expect(flattenChatMessages(pages).map((m) => m.id)).toEqual([1, 2, 5, -100]);
  });

  it("데이터가 없으면 빈 배열을 준다", () => {
    expect(flattenChatMessages(undefined)).toEqual([]);
    expect(flattenChatMessages([])).toEqual([]);
  });
});

describe("splitTextWithLinks", () => {
  it("링크가 없으면 텍스트 한 조각만 준다", () => {
    expect(splitTextWithLinks("안녕하세요")).toEqual([
      { type: "text", value: "안녕하세요" },
    ]);
  });

  it("문장 속 URL을 링크 조각으로 나눈다", () => {
    expect(splitTextWithLinks("여기 보세요 https://bookjeok.com/a 좋죠?")).toEqual(
      [
        { type: "text", value: "여기 보세요 " },
        {
          type: "link",
          value: "https://bookjeok.com/a",
          href: "https://bookjeok.com/a",
        },
        { type: "text", value: " 좋죠?" },
      ],
    );
  });

  it("www로 시작하면 https를 붙여 연결한다", () => {
    expect(splitTextWithLinks("www.bookjeok.com")).toEqual([
      {
        type: "link",
        value: "www.bookjeok.com",
        href: "https://www.bookjeok.com",
      },
    ]);
  });

  it("링크 뒤 문장부호는 링크에 포함하지 않는다", () => {
    const segments = splitTextWithLinks("https://bookjeok.com/a. 확인!");

    expect(segments[0]).toEqual({
      type: "link",
      value: "https://bookjeok.com/a",
      href: "https://bookjeok.com/a",
    });
    expect(segments[1]).toEqual({ type: "text", value: ". 확인!" });
  });

  it("짝 없는 닫는 괄호는 링크에서 떼어낸다", () => {
    const segments = splitTextWithLinks("(https://bookjeok.com/a)");

    expect(segments).toEqual([
      { type: "text", value: "(" },
      {
        type: "link",
        value: "https://bookjeok.com/a",
        href: "https://bookjeok.com/a",
      },
      { type: "text", value: ")" },
    ]);
  });

  it("링크처럼 보이지 않는 문자열은 링크로 만들지 않는다", () => {
    expect(splitTextWithLinks("bookjeok.com 에서 봐요")).toEqual([
      { type: "text", value: "bookjeok.com 에서 봐요" },
    ]);
  });
});
