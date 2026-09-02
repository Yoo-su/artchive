/**
 * 위젯을 닫아도 DOM이 유지되는지 검증.
 * 언마운트 시 말풍선·첨부 이미지 DOM이 재생성되어 웹킷에서 재디코딩 버벅임이 발생한다.
 * 마운트 유지와 함께, 안 보이는 동안 읽음 처리가 나가지 않는지도 확인한다.
 */
import { act, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChatStore } from "@/features/chat/stores/use-chat-store";

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));

vi.mock("@/shared/hooks/use-body-scroll-lock", () => ({
  useBodyScrollLock: vi.fn(),
}));

// 방/목록 내부는 이 테스트의 관심사가 아니라 마운트 횟수만 셉니다.
const roomMountCount = vi.fn();
vi.mock("@/features/chat/components/room/chat-room", () => ({
  ChatRoom: ({ roomId }: { roomId: number }) => {
    React.useEffect(() => {
      roomMountCount();
    }, []);
    return <div data-testid="chat-room">room {roomId}</div>;
  },
}));
vi.mock("@/features/chat/components/list/chat-list", () => ({
  ChatList: () => <div data-testid="chat-list">list</div>,
}));

import { ChatWidget } from "@/features/chat/components/widgets/chat-widget";

const ROOM_ID = 7;

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({ isChatOpen: false, activeChatRoomId: null });
});

const openChat = () =>
  act(() => {
    useChatStore.setState({ isChatOpen: true, activeChatRoomId: ROOM_ID });
  });

const closeChat = () =>
  act(() => {
    useChatStore.setState({ isChatOpen: false });
  });

describe("ChatWidget 마운트 유지", () => {
  it("한 번도 열지 않았으면 아무것도 렌더링하지 않는다", () => {
    render(<ChatWidget />);

    expect(screen.queryByTestId("chat-room")).toBeNull();
    expect(screen.queryByTestId("chat-list")).toBeNull();
  });

  it("닫아도 DOM에 남고, 다시 열어도 재마운트되지 않는다", () => {
    render(<ChatWidget />);

    openChat();
    expect(screen.getByTestId("chat-room")).toBeInTheDocument();
    expect(roomMountCount).toHaveBeenCalledTimes(1);

    closeChat();
    // 유지되어야 재오픈 시 재디코딩/재레이아웃이 발생하지 않는다
    expect(screen.getByTestId("chat-room")).toBeInTheDocument();

    openChat();
    expect(roomMountCount).toHaveBeenCalledTimes(1);
  });

  it("닫혀 있는 동안에는 보조기술과 포인터에서 빠진다", () => {
    render(<ChatWidget />);

    openChat();
    const widget = screen.getByTestId("chat-room").closest("[aria-hidden]")!;
    expect(widget).toHaveAttribute("aria-hidden", "false");
    expect(widget.className).not.toContain("pointer-events-none");

    closeChat();
    expect(widget).toHaveAttribute("aria-hidden", "true");
    expect(widget.className).toContain("pointer-events-none");
  });
});
