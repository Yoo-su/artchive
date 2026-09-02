/**
 * 위젯을 닫아도 DOM을 유지하는지 검증합니다.
 *
 * 예전에는 닫을 때마다 위젯을 언마운트해서 말풍선·첨부 이미지 DOM이 통째로
 * 사라졌다가 열 때 다시 만들어졌습니다. 웹킷은 디코딩한 이미지를 빨리 버리기
 * 때문에 사파리에서만 다시 여는 순간이 눈에 띄게 버벅였습니다.
 *
 * 마운트를 유지하는 대신, 안 보이는 동안 읽음 처리가 새어 나가면 안 됩니다.
 * 두 가지를 함께 확인합니다.
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
    // 사라지지 않는다 — 이게 다시 열 때의 재디코딩/재레이아웃을 없앤다
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
