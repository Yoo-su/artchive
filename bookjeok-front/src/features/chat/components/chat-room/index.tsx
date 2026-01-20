"use client";

import { useEffect, useMemo } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { useChatScroll } from "../../hooks/use-chat-scroll";
import { useTypingIndicator } from "../../hooks/use-typing-indicator";
import {
  useInfiniteChatMessagesQuery,
  useMyChatRoomsQuery,
} from "../../queries";
import { useChatStore } from "../../stores/use-chat-store";
import { ChatRoomHeader } from "./header";
import { ChatInput } from "./input";
import { MessageList } from "./message-list";
import { ChatRoomSkeleton } from "./skeleton";

/**
 * 채팅방 메인 컴포넌트입니다.
 * - 헤더, 메시지 목록, 입력 영역의 레이아웃을 잡고 하위 컴포넌트들을 조합합니다.
 * - 채팅방 데이터(useMyChatRoomsQuery)와 메시지 데이터(useInfiniteChatMessagesQuery)를 관리합니다.
 * - 소켓 연결 상태에 따라 읽음 처리를 수행합니다.
 */
export const ChatRoom = () => {
  const { activeChatRoomId, typingUsers, isRoomInactive } = useChatStore();
  const { socket } = useSocketContext();
  const currentUser = useAuthStore((state) => state.user);

  const { data: roomsData } = useMyChatRoomsQuery();
  const {
    data: messagesData,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    isLoading: isMessagesLoading,
  } = useInfiniteChatMessagesQuery(activeChatRoomId!);

  // 현재 채팅방 정보
  const room = useMemo(
    () => roomsData?.find((r) => r.id === activeChatRoomId),
    [roomsData, activeChatRoomId],
  );

  // 메시지 정렬
  const messages = useMemo(() => {
    if (!messagesData) return [];
    return messagesData.pages
      .flatMap((page) => page.messages)
      .sort((a, b) => {
        // 1. 전송 중인 메시지(ID < 0)는 항상 전송 완료된 메시지보다 뒤로 보냄
        const isASending = a.id < 0;
        const isBSending = b.id < 0;

        if (isASending && !isBSending) return 1;
        if (!isASending && isBSending) return -1;

        // 2. 둘 다 같은 상태(둘 다 전송 중이거나 둘 다 완료)라면 시간순 정렬
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
  }, [messagesData]);

  // 타이핑 인디케이터 훅
  const { handleTyping, cancelTyping } = useTypingIndicator({
    roomId: activeChatRoomId,
  });

  // 스크롤 관리 훅
  const { messagesEndRef, messageContainerRef, handleScroll } = useChatScroll({
    messages,
    hasPreviousPage: hasPreviousPage ?? false,
    isFetchingPreviousPage,
    fetchPreviousPage,
  });

  // 상대방 정보
  const opponent = room?.participants.find(
    (p) => p.user.id !== currentUser?.id,
  )?.user;

  // UI 상태
  const typingNickname = activeChatRoomId ? typingUsers[activeChatRoomId] : "";
  const isInactive = isRoomInactive[room?.id ?? -1] || false;

  // 채팅방 입장 시 읽음 처리
  useEffect(() => {
    if (socket && activeChatRoomId) {
      socket.emit("markAsRead", { roomId: activeChatRoomId });
    }
  }, [socket, activeChatRoomId]);

  // 로딩 상태
  if (isMessagesLoading || !room) {
    return <ChatRoomSkeleton />;
  }

  // 상대방 정보가 없는 경우
  if (!opponent) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        상대방 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <ChatRoomHeader
        room={room}
        opponentNickname={opponent.nickname}
        opponentProfileImageUrl={opponent.profileImageUrl}
        typingNickname={typingNickname}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUser?.id}
        isFetchingPreviousPage={isFetchingPreviousPage}
        messagesEndRef={messagesEndRef}
        messageContainerRef={messageContainerRef}
        onScroll={handleScroll}
      />

      <ChatInput
        roomId={activeChatRoomId!}
        currentUserId={currentUser!.id}
        currentUserHandle={currentUser!.handle}
        currentUserNickname={currentUser!.nickname}
        currentUserProfileImageUrl={currentUser!.profileImageUrl}
        isInactive={isInactive}
        onTyping={handleTyping}
        cancelTyping={cancelTyping}
      />
    </div>
  );
};
