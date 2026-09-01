/**
 * 채팅 이미지 렌더링 검증.
 *
 * 메시지 썸네일은 208px 슬롯에 표시되므로 Next 이미지 최적화를 거쳐야 합니다.
 * unoptimized로 원본(최대 1920px)을 그대로 받으면 채팅방을 다시 열 때마다
 * 전부 재디코딩되어 위젯 열림이 눈에 띄게 버벅입니다.
 */
import { ChatMessage } from "@bookjeok/core";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { MessageList } from "@/features/chat/components/room/chat-room/message-list";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));
vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));
vi.mock("@/features/confirm", () => ({ useConfirm: () => vi.fn() }));

const BLOB_URL = "https://test.public.blob.vercel-storage.com/chat/photo.jpg";

const imageMessage: ChatMessage = {
  id: 1,
  content: "",
  isRead: true,
  metadata: { imageUrls: [BLOB_URL] },
  createdAt: new Date().toISOString(),
  sender: { id: 2, handle: "you", nickname: "상대", profileImageUrl: null },
  chatRoom: { id: 1 },
};

const renderList = () =>
  render(
    <MessageList
      messages={[imageMessage]}
      currentUserId={1}
      isFetchingPreviousPage={false}
      messagesEndRef={{ current: null }}
      messageContainerRef={{ current: null }}
      onScroll={vi.fn()}
    />,
  );

describe("채팅 메시지 이미지", () => {
  it("썸네일을 원본이 아닌 최적화된 URL로 요청한다", () => {
    renderList();

    const img = screen.getByAltText("common.aria.preview_image");
    const src = img.getAttribute("src") ?? "";

    // 원본 URL을 그대로 쓰지 않는다 (unoptimized 회귀 방지)
    expect(src).not.toBe(BLOB_URL);
    // Next 이미지 최적화 경로를 거치며 너비가 지정된다
    expect(src).toContain("/_next/image");
    expect(src).toMatch(/[?&]w=\d+/);
  });

  it("208px 슬롯에 맞는 작은 후보를 srcset에 제공한다", () => {
    renderList();

    const img = screen.getByAltText("common.aria.preview_image");
    // sizes가 있어야 브라우저가 208px 슬롯에 맞는 후보를 고를 수 있다
    expect(img.getAttribute("sizes")).toBe("208px");

    const widths = [...(img.getAttribute("srcset") ?? "").matchAll(/[?&]w=(\d+)/g)]
      .map((m) => Number(m[1]));
    expect(widths.length).toBeGreaterThan(0);
    // 고배율 화면(DPR 2, 416px)에서도 640px 이하 후보가 선택 가능해야 한다
    expect(Math.min(...widths)).toBeLessThanOrEqual(640);
  });
});
