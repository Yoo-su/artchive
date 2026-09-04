"use client";

import { ChatRoom as ChatRoomType } from "@bookjeok/core";
import {
  useInfiniteChatMessagesQuery,
  useMyChatRoomsQuery,
} from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { ArrowDown } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils/cn";

import { useChatScroll } from "../../../hooks/use-chat-scroll";
import { useMarkRoomAsRead } from "../../../hooks/use-mark-room-as-read";
import { useMessageRetry } from "../../../hooks/use-message-retry";
import { useTypingIndicator } from "../../../hooks/use-typing-indicator";
import { useChatStore } from "../../../stores/use-chat-store";
import { resyncRoomMessages } from "../../../utils/chat-cache-utils";
import { flattenChatMessages } from "../../../utils/chat-message-utils";
import { TradeStatusBanner } from "../../trade/trade-status-banner";
import { ChatRoomHeader } from "./header";
import { ChatInput } from "./input";
import { MessageList } from "./message-list";
import { ChatRoomSkeleton } from "./skeleton";

interface ChatRoomProps {
  /** 표시할 채팅방 ID */
  roomId: number;
}

/**
 * 채팅방 메인 컴포넌트입니다.
 * - 헤더, 메시지 목록, 입력 영역의 레이아웃을 잡고 하위 컴포넌트들을 조합합니다.
 * - 채팅방 데이터(useMyChatRoomsQuery)와 메시지 데이터(useInfiniteChatMessagesQuery)를 관리합니다.
 * - 방이 보이는 동안의 읽음 처리를 담당합니다.
 */
export const ChatRoom = ({ roomId }: ChatRoomProps) => {
  const typingNickname = useChatStore(
    (state) => state.typingUsers[roomId] || "",
  );
  const isInactive = useChatStore(
    (state) => state.isRoomInactive[roomId] || false,
  );
  const opponentLastReadMessageId = useChatStore(
    (state) => state.opponentLastReadMessageId[roomId] ?? 0,
  );
  // 위젯은 닫혀도 언마운트되지 않으므로 노출 여부를 별도로 판단
  // (안 보이는 동안 도착한 메시지가 읽음 처리되는 것을 방지)
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const setOpponentLastReadMessageId = useChatStore(
    (state) => state.setOpponentLastReadMessageId,
  );
  const currentUser = useAuthStore((state) => state.user);

  // 방 목록 캐시는 어느 방에 메시지가 오든 새 배열로 교체되므로
  // 필요한 방 하나만 구독해 다른 방의 활동으로 인한 리렌더 차단
  const selectRoom = useCallback(
    (rooms: ChatRoomType[]) => rooms.find((r) => r.id === roomId),
    [roomId],
  );
  const { data: room } = useMyChatRoomsQuery({ select: selectRoom });

  const {
    data: messagesData,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    isLoading: isMessagesLoading,
  } = useInfiniteChatMessagesQuery(roomId);

  // 페이지 배열은 과거 → 최신, 페이지 내부는 최신 → 과거 순
  // 페이지 단위로 뒤집어 이어 붙이면 전체가 시간순이 되므로 별도 정렬 불필요
  const messages = useMemo(
    () => flattenChatMessages(messagesData?.pages),
    [messagesData],
  );

  // 타이핑 인디케이터 훅
  const { handleTyping, cancelTyping } = useTypingIndicator({ roomId });

  // 스크롤 관리 훅
  const {
    messagesEndRef,
    messageContainerRef,
    contentRef,
    handleScroll,
    scrollToBottom,
    isAtBottom,
    missedMessageCount,
  } = useChatScroll({
    roomId,
    messages,
    hasPreviousPage: hasPreviousPage ?? false,
    isFetchingPreviousPage,
    fetchPreviousPage,
  });

  const { retryMessage, discardMessage } = useMessageRetry(roomId);

  // 상대방 정보
  const opponent = room?.participants.find(
    (p) => p.user.id !== currentUser?.id,
  )?.user;

  // 읽음 처리 대상: 내가 보내지 않은, 서버에 저장된 메시지
  // 이 값이 올라갈 때만 요청을 보내 같은 지점의 중복 처리 방지
  const newestIncomingMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.id > 0 && message.sender?.id !== currentUser?.id) {
        return message.id;
      }
    }
    return 0;
  }, [messages, currentUser?.id]);

  // 캐시의 가장 최신 메시지 (미확정 낙관적 메시지 제외)
  const newestCachedMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].id > 0) return messages[i].id;
    }
    return 0;
  }, [messages]);

  const queryClient = useQueryClient();
  const roomLastMessageId = room?.lastMessage?.id ?? 0;
  const resyncedForRef = useRef({ roomId, messageId: 0 });

  // 방 목록 쿼리는 창 포커스마다 갱신되지만 메시지 캐시는 갱신되지 않아,
  // 앱 복귀 시 목록에만 새 메시지가 반영되고 방 안은 비는 문제가 있다.
  // 소켓 connect 기반 동기화는 좀비 소켓/지연 재연결에서 동작하지 않으므로,
  // 목록의 마지막 메시지가 방 캐시에 없으면 여기서 직접 보충
  useEffect(() => {
    if (resyncedForRef.current.roomId !== roomId) {
      resyncedForRef.current = { roomId, messageId: 0 };
    }

    // 첫 로딩 전에는 비교 기준 없음
    if (newestCachedMessageId === 0) return;
    // 캐시가 뒤처지지 않은 경우
    if (roomLastMessageId <= newestCachedMessageId) return;
    // 같은 지점에 대한 반복 요청 방지
    if (roomLastMessageId <= resyncedForRef.current.messageId) return;

    resyncedForRef.current = { roomId, messageId: roomLastMessageId };
    resyncRoomMessages(queryClient, roomId);
  }, [roomId, roomLastMessageId, newestCachedMessageId, queryClient]);

  const markRoomAsRead = useMarkRoomAsRead();
  const lastMarkedRef = useRef({ roomId, messageId: 0 });

  useEffect(() => {
    if (lastMarkedRef.current.roomId !== roomId) {
      lastMarkedRef.current = { roomId, messageId: 0 };
    }
    // 위젯이 닫힌 동안 도착한 메시지는 읽음 처리하지 않고,
    // 다시 열릴 때 마지막 메시지 기준으로 일괄 처리
    if (!isChatOpen) return;
    if (newestIncomingMessageId <= lastMarkedRef.current.messageId) return;

    lastMarkedRef.current = { roomId, messageId: newestIncomingMessageId };
    markRoomAsRead(roomId);
  }, [roomId, isChatOpen, newestIncomingMessageId, markRoomAsRead]);

  // 상대방의 읽음 지점 초기값 (서버는 첫 페이지 응답에만 포함)
  const serverOpponentLastRead = useMemo(() => {
    let latest: number | null = null;
    for (const page of messagesData?.pages ?? []) {
      const value = page.opponentLastReadMessageId;
      if (typeof value === "number" && (latest === null || value > latest)) {
        latest = value;
      }
    }
    return latest;
  }, [messagesData]);

  useEffect(() => {
    if (serverOpponentLastRead === null) return;
    setOpponentLastReadMessageId(roomId, serverOpponentLastRead);
  }, [roomId, serverOpponentLastRead, setOpponentLastReadMessageId]);

  const t = useTranslations("chat");

  // 로딩 상태
  if (isMessagesLoading || !room || !currentUser) {
    return <ChatRoomSkeleton />;
  }

  // 상대방 정보가 없는 경우
  if (!opponent) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        {t("user_not_found")}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <ChatRoomHeader
        room={room}
        opponentNickname={opponent.nickname}
        opponentProfileImageUrl={opponent.profileImageUrl}
        opponentHandle={opponent.handle}
        typingNickname={typingNickname}
      />

      <TradeStatusBanner
        room={room}
        currentUser={currentUser}
        opponent={opponent}
      />

      <div className="relative flex min-h-0 grow flex-col">
        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
          opponentLastReadMessageId={opponentLastReadMessageId}
          isFetchingPreviousPage={isFetchingPreviousPage}
          messagesEndRef={messagesEndRef}
          messageContainerRef={messageContainerRef}
          contentRef={contentRef}
          onScroll={handleScroll}
          onRetryMessage={retryMessage}
          onDiscardMessage={discardMessage}
        />

        {/* 위쪽을 보고 있을 때만 노출되는 "맨 아래로" 버튼 */}
        {!isAtBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            aria-label={
              missedMessageCount > 0
                ? t("aria.new_messages", { count: missedMessageCount })
                : t("aria.scroll_to_latest")
            }
            className={cn(
              "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center justify-center gap-1.5 rounded-full bg-stone-900/85 text-xs font-medium text-white shadow-lg transition-colors hover:bg-stone-900",
              missedMessageCount > 0
                ? "py-1.5 pl-3 pr-2.5"
                : // 아이콘만 있을 때는 정사각 버튼으로 렌더링해 가운데 정렬
                  "size-7 p-0",
            )}
          >
            {missedMessageCount > 0 && (
              <span className="tabular-nums">
                {t("new_messages", { count: missedMessageCount })}
              </span>
            )}
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <ChatInput
        roomId={roomId}
        currentUserId={currentUser.id}
        currentUserHandle={currentUser.handle}
        currentUserNickname={currentUser.nickname}
        currentUserProfileImageUrl={currentUser.profileImageUrl}
        isInactive={isInactive}
        onTyping={handleTyping}
        cancelTyping={cancelTyping}
      />
    </div>
  );
};
