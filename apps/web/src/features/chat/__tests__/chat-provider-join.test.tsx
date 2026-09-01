/**
 * ChatProvider의 채팅방 입장(joinRooms) 처리 검증.
 *
 * 입장에 실패하면 실시간 메시지를 전혀 받지 못하므로,
 * 재시도가 실제로 일어나는지와 끝내 실패했을 때 사용자에게 알리는지를 확인합니다.
 */
import { render } from "@testing-library/react";
import { act } from "react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatProvider } from "@/features/chat/providers/chat-provider";
import { useChatStore } from "@/features/chat/stores/use-chat-store";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("next-intl", () => ({
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/ko" }));

// 실제 쿼리 캐시처럼 렌더 간 동일한 배열 참조를 유지합니다.
const mockRooms = [{ id: 1 }, { id: 2 }];
vi.mock("@bookjeok/react-query", () => ({
  useMyChatRoomsQuery: () => ({ data: mockRooms, isSuccess: true }),
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (selector: (state: { user: { id: number } }) => unknown) =>
    selector({ user: { id: 1 } }),
}));

vi.mock("@/features/chat/hooks/use-chat-events", () => ({
  useChatEvents: () => ({
    registerChatEventListeners: vi.fn(),
    unregisterChatEventListeners: vi.fn(),
  }),
}));

vi.mock("@/features/chat/components/widgets/chat-toggle-button", () => ({
  ChatToggleButton: () => null,
}));
vi.mock("@/features/chat/components/widgets/chat-widget", () => ({
  ChatWidget: () => null,
}));

const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
// 실제 SocketProvider의 socket은 useState 값이라 렌더 간 동일한 참조입니다.
const mockSocket = {
  timeout: () => ({ emit: mockEmit }),
  on: mockOn,
  off: mockOff,
};
vi.mock("@/shared/providers/socket-provider", () => ({
  useSocketContext: () => ({ socket: mockSocket, isConnected: true }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  useChatStore.setState({ hasJoinedRooms: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ChatProvider joinRooms", () => {
  it("입장에 성공하면 한 번만 요청하고 참여 상태로 표시한다", () => {
    mockEmit.mockImplementation((_event, _roomIds, ack) => {
      ack(null, { status: "ok", joinedRooms: [1, 2] });
    });

    render(<ChatProvider>{null}</ChatProvider>);

    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit.mock.calls[0][1]).toEqual([1, 2]);
    expect(useChatStore.getState().hasJoinedRooms).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("실패하면 백오프로 재시도하고, 모두 실패하면 사용자에게 알린다", () => {
    mockEmit.mockImplementation((_event, _roomIds, ack) => {
      ack(null, { status: "error" });
    });

    render(<ChatProvider>{null}</ChatProvider>);

    // 1회차 실패 후 1초 뒤 재시도
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockEmit).toHaveBeenCalledTimes(2);

    // 2회차 실패 후 2초 뒤 마지막 시도
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockEmit).toHaveBeenCalledTimes(3);

    // 최대 시도 횟수 소진 → 안내 후 중단
    expect(toast.error).toHaveBeenCalledWith("chat.toast.join_failed");
    expect(useChatStore.getState().hasJoinedRooms).toBe(false);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(mockEmit).toHaveBeenCalledTimes(3);
  });

  it("ack 타임아웃도 실패로 처리해 재시도한다", () => {
    mockEmit.mockImplementation((_event, _roomIds, ack) => {
      ack(new Error("operation has timed out"));
    });

    render(<ChatProvider>{null}</ChatProvider>);
    expect(mockEmit).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockEmit).toHaveBeenCalledTimes(2);
  });
});
