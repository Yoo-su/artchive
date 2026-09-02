"use client";

import { ChatRoom as ChatRoomType } from "@bookjeok/core";
import {
  useInfiniteChatMessagesQuery,
  useMyChatRoomsQuery,
} from "@bookjeok/react-query";
import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import { useChatScroll } from "../../../hooks/use-chat-scroll";
import { useMarkRoomAsRead } from "../../../hooks/use-mark-room-as-read";
import { useMessageRetry } from "../../../hooks/use-message-retry";
import { useTypingIndicator } from "../../../hooks/use-typing-indicator";
import { useChatStore } from "../../../stores/use-chat-store";
import { flattenChatMessages } from "../../../utils/chat-message-utils";
import { TradeStatusBanner } from "../../trade/trade-status-banner";
import { ChatRoomHeader } from "./header";
import { ChatInput } from "./input";
import { MessageList } from "./message-list";
import { ChatRoomSkeleton } from "./skeleton";

interface ChatRoomProps {
  /** 표시할 채팅방 ID. 열려 있는 방이 있을 때만 렌더링되므로 항상 존재합니다. */
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
  // 위젯은 닫혀도 언마운트되지 않으므로(다시 열 때의 버벅임 방지),
  // "화면에 보이는가"를 따로 봐야 합니다. 안 보이는 동안 온 메시지를
  // 읽음 처리해 버리면 사용자가 보지도 않은 메시지가 읽음이 됩니다.
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const setOpponentLastReadMessageId = useChatStore(
    (state) => state.setOpponentLastReadMessageId,
  );
  const currentUser = useAuthStore((state) => state.user);

  // 방 목록 캐시는 어느 방에 메시지가 오든 새 배열로 교체됩니다.
  // 필요한 방 하나만 골라 구독해 다른 방의 활동으로 리렌더되지 않게 합니다.
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

  // 페이지 배열은 과거 → 최신, 각 페이지 안은 최신 → 과거 순입니다.
  // 페이지마다 뒤집어 이어 붙이면 전체가 시간순이 되므로 정렬이 필요 없습니다.
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

  // 읽음 처리 대상은 "내가 보내지 않은, 서버에 저장된 메시지"입니다.
  // 이 값이 올라갈 때만 요청을 보내 같은 지점을 반복해서 읽음 처리하지 않습니다.
  const newestIncomingMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.id > 0 && message.sender?.id !== currentUser?.id) {
        return message.id;
      }
    }
    return 0;
  }, [messages, currentUser?.id]);

  const markRoomAsRead = useMarkRoomAsRead();
  const lastMarkedRef = useRef({ roomId, messageId: 0 });

  useEffect(() => {
    if (lastMarkedRef.current.roomId !== roomId) {
      lastMarkedRef.current = { roomId, messageId: 0 };
    }
    // 위젯이 닫혀 있는 동안 도착한 메시지는 읽음 처리하지 않습니다.
    // 다시 열리면 이 이펙트가 그때의 마지막 메시지로 한 번에 처리합니다.
    if (!isChatOpen) return;
    if (newestIncomingMessageId <= lastMarkedRef.current.messageId) return;

    lastMarkedRef.current = { roomId, messageId: newestIncomingMessageId };
    markRoomAsRead(roomId);
  }, [roomId, isChatOpen, newestIncomingMessageId, markRoomAsRead]);

  // 상대방의 읽음 지점 초기값. 서버는 첫 페이지 응답에만 실어 보냅니다.
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
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-stone-900/85 py-1.5 pl-3 pr-2.5 text-xs font-medium text-white shadow-lg transition-colors hover:bg-stone-900"
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
