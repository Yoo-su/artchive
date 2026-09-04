/**
 * 메시지 목록의 상태 표시 검증.
 * - 실패한 메시지는 재전송/삭제 수단과 함께 유지되는지
 * - 읽음 표시가 내 마지막 메시지에만 붙는지
 * - 줄바꿈과 링크가 본문에 반영되는지
 */
import { ChatMessage } from "@bookjeok/core";
import { fireEvent, render, screen } from "@testing-library/react";
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

const ME = 1;
const YOU = 2;

const message = (
  overrides: Partial<ChatMessage> & Pick<ChatMessage, "id">,
): ChatMessage => ({
  content: "안녕하세요",
  isRead: false,
  createdAt: new Date().toISOString(),
  sender: { id: ME, handle: "me", nickname: "나", profileImageUrl: null },
  chatRoom: { id: 1 },
  ...overrides,
});

const renderList = (
  messages: ChatMessage[],
  props: Partial<React.ComponentProps<typeof MessageList>> = {},
) =>
  render(
    <MessageList
      messages={messages}
      currentUserId={ME}
      isFetchingPreviousPage={false}
      messagesEndRef={{ current: null }}
      messageContainerRef={{ current: null }}
      onScroll={vi.fn()}
      {...props}
    />,
  );

describe("실패한 메시지", () => {
  const failed = message({
    id: -1,
    content: "보내다 실패한 메시지",
    clientMessageId: "cid-1",
    sendState: "failed",
  });

  it("목록에 남고 재전송·삭제 수단을 제공한다", () => {
    const onRetryMessage = vi.fn();
    const onDiscardMessage = vi.fn();

    renderList([failed], { onRetryMessage, onDiscardMessage });

    expect(screen.getByText("보내다 실패한 메시지")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("chat.aria.retry_message"));
    expect(onRetryMessage).toHaveBeenCalledWith(failed);

    fireEvent.click(screen.getByLabelText("chat.aria.discard_message"));
    expect(onDiscardMessage).toHaveBeenCalledWith(failed);
  });

  it("전송 중인 메시지에는 재전송 버튼을 보여주지 않는다", () => {
    renderList([{ ...failed, sendState: "sending" }], {
      onRetryMessage: vi.fn(),
    });

    expect(screen.queryByLabelText("chat.aria.retry_message")).toBeNull();
  });
});

describe("읽음 표시", () => {
  const messages = [
    message({ id: 10 }),
    message({
      id: 11,
      sender: {
        id: YOU,
        handle: "you",
        nickname: "상대",
        profileImageUrl: null,
      },
    }),
    message({ id: 12, content: "내 마지막 메시지" }),
  ];

  it("상대가 읽은 지점을 지났으면 내 마지막 메시지에만 읽음을 표시한다", () => {
    renderList(messages, { opponentLastReadMessageId: 12 });

    expect(screen.getAllByText("chat.read")).toHaveLength(1);
  });

  it("아직 읽지 않았으면 읽음을 표시하지 않는다", () => {
    renderList(messages, { opponentLastReadMessageId: 11 });

    expect(screen.queryByText("chat.read")).toBeNull();
  });
});

describe("본문 렌더링", () => {
  it("줄바꿈을 그대로 유지한다", () => {
    renderList([message({ id: 1, content: "첫 줄\n둘째 줄" })]);

    const paragraph = screen.getByText(/첫 줄/).closest("p");
    expect(paragraph).toHaveTextContent("첫 줄 둘째 줄");
    // 줄바꿈 문자를 그대로 두고 CSS로 살립니다.
    expect(paragraph?.textContent).toBe("첫 줄\n둘째 줄");
    expect(paragraph?.className).toContain("whitespace-pre-wrap");
  });

  it("URL을 새 탭으로 여는 링크로 만든다", () => {
    renderList([
      message({ id: 1, content: "여기 https://bookjeok.com 보세요" }),
    ]);

    const link = screen.getByRole("link", { name: "https://bookjeok.com" });
    expect(link).toHaveAttribute("href", "https://bookjeok.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
