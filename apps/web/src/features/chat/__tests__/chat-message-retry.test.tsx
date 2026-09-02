/**
 * 실패한 메시지의 재전송/삭제 동작을 검증합니다.
 *
 * 재전송에 필요한 값은 실패한 메시지 자체에 들어 있어야 합니다.
 * 그래야 입력창 상태와 무관하게, 이미 올라간 이미지를 다시 올리지 않고
 * 같은 상관 ID로 다시 보낼 수 있습니다.
 */
import { chatKeys, ChatMessage } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMessageRetry } from "@/features/chat/hooks/use-message-retry";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("next-intl", () => ({
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));

const mockEmit = vi.fn();
const mockTimeout = vi.fn((_ms: number) => ({ emit: mockEmit }));
vi.mock("@/shared/providers/socket-provider", () => ({
  useSocketContext: () => ({
    socket: { timeout: (ms: number) => mockTimeout(ms) },
    isConnected: true,
  }),
}));

const ROOM_ID = 10;
const CLIENT_MESSAGE_ID = "cid-failed";
const UPLOADED_URL = "https://blob.test/uploaded.jpg";

const failedMessage: ChatMessage = {
  id: -1,
  content: "사진 보냅니다",
  isRead: false,
  metadata: { imageUrls: [UPLOADED_URL] },
  clientMessageId: CLIENT_MESSAGE_ID,
  sendState: "failed",
  createdAt: new Date().toISOString(),
  sender: { id: 1, handle: "me", nickname: "나", profileImageUrl: null },
  chatRoom: { id: ROOM_ID },
};

const RetryHarness = () => {
  const { retryMessage, discardMessage } = useMessageRetry(ROOM_ID);
  return (
    <>
      <button onClick={() => retryMessage(failedMessage)}>retry</button>
      <button onClick={() => discardMessage(failedMessage)}>discard</button>
    </>
  );
};

let queryClient: QueryClient;

const getCachedMessages = (): ChatMessage[] => {
  const data = queryClient.getQueryData<{
    pages: { messages: ChatMessage[] }[];
  }>(chatKeys.messages(ROOM_ID).queryKey);
  return data?.pages.flatMap((page) => page.messages) ?? [];
};

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(chatKeys.messages(ROOM_ID).queryKey, {
    pages: [{ messages: [failedMessage] }],
    pageParams: [undefined],
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RetryHarness />
    </QueryClientProvider>,
  );
});

describe("useMessageRetry", () => {
  it("이미 업로드된 URL과 같은 상관 ID로 다시 보낸다", () => {
    mockEmit.mockImplementation((_event, _payload, ack) => {
      ack(null, { status: "ok" });
    });

    act(() => {
      fireEvent.click(screen.getByText("retry"));
    });

    expect(mockTimeout).toHaveBeenCalledWith(10_000);
    expect(mockEmit.mock.calls[0][0]).toBe("sendMessage");
    // 재업로드 없이 이미 올라간 URL을 그대로 다시 실어 보낸다
    expect(mockEmit.mock.calls[0][1]).toEqual({
      roomId: ROOM_ID,
      content: "사진 보냅니다",
      imageUrls: [UPLOADED_URL],
      clientMessageId: CLIENT_MESSAGE_ID,
    });
  });

  it("재전송하는 동안에는 전송 중 상태로 되돌린다", () => {
    // ack을 호출하지 않아 응답을 기다리는 상태를 만든다
    mockEmit.mockImplementation(() => {});

    act(() => {
      fireEvent.click(screen.getByText("retry"));
    });

    expect(getCachedMessages()[0].sendState).toBe("sending");
  });

  it("재전송도 실패하면 다시 실패 상태로 되돌린다", () => {
    mockEmit.mockImplementation((_event, _payload, ack) => {
      ack(null, { status: "error", error: "CHAT_PARTICIPANT_WITHDRAWN" });
    });

    act(() => {
      fireEvent.click(screen.getByText("retry"));
    });

    expect(getCachedMessages()[0].sendState).toBe("failed");
  });

  it("삭제하면 목록에서 사라진다", () => {
    act(() => {
      fireEvent.click(screen.getByText("discard"));
    });

    expect(getCachedMessages()).toHaveLength(0);
  });
});
