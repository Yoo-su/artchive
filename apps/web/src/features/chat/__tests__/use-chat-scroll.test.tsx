import { ChatMessage } from "@bookjeok/core";
import { act, fireEvent, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChatScroll } from "../hooks/use-chat-scroll";

describe("useChatScroll", () => {
  let resizeCallbacks: ((entries: any[]) => void)[] = [];
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resizeCallbacks = [];
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    class MockResizeObserver {
      constructor(callback: (entries: any[]) => void) {
        resizeCallbacks.push(callback);
      }
      observe = observeMock;
      unobserve = vi.fn();
      disconnect = disconnectMock;
    }
    global.ResizeObserver = MockResizeObserver as any;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createDummyMessage = (id: number): ChatMessage => ({
    id,
    content: `Message ${id}`,
    createdAt: new Date().toISOString(),
    isRead: true,
    chatRoom: { id: 1 },
    sender: { id: 1, nickname: "User", handle: "user", profileImageUrl: null },
  });

  const setElementDimensions = (
    el: HTMLElement,
    scrollHeight: number,
    clientHeight: number,
  ) => {
    Object.defineProperty(el, "scrollHeight", {
      value: scrollHeight,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(el, "clientHeight", {
      value: clientHeight,
      configurable: true,
      writable: true,
    });
  };

  interface TestComponentProps {
    roomId?: number;
    messages: ChatMessage[];
    hasPreviousPage?: boolean;
    isFetchingPreviousPage?: boolean;
    fetchPreviousPage?: () => void;
  }

  const TestChatComponent = ({
    roomId = 1,
    messages,
    hasPreviousPage = false,
    isFetchingPreviousPage = false,
    fetchPreviousPage = vi.fn(),
  }: TestComponentProps) => {
    const { messageContainerRef, contentRef, messagesEndRef, handleScroll } =
      useChatScroll({
        roomId,
        messages,
        hasPreviousPage,
        isFetchingPreviousPage,
        fetchPreviousPage,
      });

    return (
      <div
        data-testid="scroll-container"
        ref={messageContainerRef}
        onScroll={handleScroll}
        style={{ height: 600, overflowY: "auto" }}
      >
        <div ref={contentRef}>
          {messages.map((m) => (
            <div key={m.id} style={{ height: 100 }}>
              {m.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  };

  it("채팅방 첫 진입(초기 로드) 시 즉시 스크롤을 최하단으로 설정한다", () => {
    const { getByTestId, rerender } = render(
      <TestChatComponent messages={[]} />,
    );

    const container = getByTestId("scroll-container");
    setElementDimensions(container, 1000, 600);

    rerender(
      <TestChatComponent
        messages={[createDummyMessage(1), createDummyMessage(2)]}
      />,
    );

    expect(container.scrollTop).toBe(1000);
  });

  it("새 메시지 수신 시 부드럽게 최하단으로 스크롤한다", () => {
    const initialMessages = [createDummyMessage(1), createDummyMessage(2)];

    const { getByTestId, rerender } = render(
      <TestChatComponent messages={initialMessages} />,
    );

    const container = getByTestId("scroll-container");
    setElementDimensions(container, 1000, 600);

    (container as any).scrollTo = vi.fn(
      (options?: ScrollToOptions | number) => {
        if (typeof options === "object" && options?.top !== undefined) {
          container.scrollTop = options.top;
        }
      },
    );

    // 사용자가 하단 위치에 있음 (scrollTop = 400, scrollHeight = 1000, clientHeight = 600)
    container.scrollTop = 400;

    // 새 메시지 수신 시뮬레이션
    setElementDimensions(container, 1200, 600);
    rerender(
      <TestChatComponent
        messages={[...initialMessages, createDummyMessage(3)]}
      />,
    );

    expect((container as any).scrollTo).toHaveBeenCalledWith({
      top: 1200,
      behavior: "smooth",
    });
  });

  it("거래 카드 비동기 렌더링/배너 크기 변경 시 ResizeObserver를 통해 하단 스크롤을 유지한다", () => {
    const { getByTestId } = render(
      <TestChatComponent messages={[createDummyMessage(1)]} />,
    );

    const container = getByTestId("scroll-container");
    setElementDimensions(container, 1000, 600);

    // 사용자 위치가 최하단
    container.scrollTop = 400;

    // 거래 카드가 비동기로 로드되어 scrollHeight가 1400으로 확장
    setElementDimensions(container, 1400, 600);

    // ResizeObserver 트리거
    act(() => {
      resizeCallbacks.forEach((cb) => cb([]));
    });

    expect(container.scrollTop).toBe(1400);
  });

  it("이전 메시지 페이징 로드 시 보고 있던 스크롤 상대 위치를 유지한다", () => {
    const fetchPreviousPage = vi.fn();
    const initialMessages = [createDummyMessage(3), createDummyMessage(4)];

    const { getByTestId, rerender } = render(
      <TestChatComponent
        messages={initialMessages}
        hasPreviousPage={true}
        fetchPreviousPage={fetchPreviousPage}
      />,
    );

    const container = getByTestId("scroll-container");
    setElementDimensions(container, 1000, 600);

    // 상단으로 스크롤하여 페이징 이벤트 발생
    container.scrollTop = 5;
    fireEvent.scroll(container);

    expect(fetchPreviousPage).toHaveBeenCalled();

    // 과거 메시지가 앞에 추가됨 (scrollHeight가 1000 -> 1500으로 증가)
    setElementDimensions(container, 1500, 600);
    rerender(
      <TestChatComponent
        messages={[
          createDummyMessage(1),
          createDummyMessage(2),
          ...initialMessages,
        ]}
        hasPreviousPage={true}
        fetchPreviousPage={fetchPreviousPage}
      />,
    );

    // 스크롤 위치가 (기존 scrollTop 5 + 높이 차이 500 = 505)로 유지되어야 함
    expect(container.scrollTop).toBe(505);
  });
});
