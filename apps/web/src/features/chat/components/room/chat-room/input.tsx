import { chatKeys, ChatMessage } from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { SendHorizontal } from "lucide-react";
import { FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";
import { useSocketContext } from "@/shared/providers/socket-provider";

interface ChatInputProps {
  roomId: number;
  currentUserId: number;
  currentUserHandle: string;
  currentUserNickname: string;
  currentUserProfileImageUrl?: string | null;
  isInactive: boolean;
  onTyping: () => void;
  cancelTyping: () => void;
}

/**
 * 채팅 입력 폼 컴포넌트입니다.
 * - 메시지 입력 및 전송 기능을 제공합니다.
 * - 전송 시 '낙관적 업데이트'를 통해 즉시 화면에 메시지를 표시합니다.
 * - 채팅방이 비활성화된 경우 입력 폼 대신 안내 메시지를 표시합니다.
 */
export const ChatInput = ({
  roomId,
  currentUserId,
  currentUserHandle,
  currentUserNickname,
  currentUserProfileImageUrl,
  isInactive,
  onTyping,
  cancelTyping,
}: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);
      onTyping();
    },
    [onTyping],
  );

  const handleSendMessage = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!socket || !roomId || !newMessage.trim()) return;

      const messageContent = newMessage.trim();
      const tempId = -Date.now(); // 임시 ID (음수로 서버 ID와 충돌 방지)

      // 낙관적 업데이트: 즉시 UI에 메시지 표시
      const optimisticMessage: ChatMessage = {
        id: tempId,
        content: messageContent,
        isRead: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          handle: currentUserHandle,
          nickname: currentUserNickname,
          profileImageUrl: currentUserProfileImageUrl ?? null,
        },
        chatRoom: { id: roomId },
      };

      // 캐시에 낙관적 메시지 추가
      queryClient.setQueryData<{
        pages: { messages: ChatMessage[] }[];
        pageParams: (number | undefined)[];
      }>(chatKeys.messages(roomId).queryKey, (oldData) => {
        if (!oldData) return oldData;
        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          messages: [optimisticMessage, ...newPages[0].messages],
        };
        return { ...oldData, pages: newPages };
      });

      // 입력 필드 즉시 초기화 (UX 개선)
      setNewMessage("");
      cancelTyping();

      // 서버에 메시지 전송
      socket.emit(
        "sendMessage",
        { roomId, content: messageContent },
        (response: { status: string; error?: string }) => {
          if (response.status !== "ok") {
            console.error("Message failed to send:", response.error);
            toast.error(`메시지 전송에 실패했습니다: ${response.error}`);

            // 실패 시 낙관적 메시지 롤백
            queryClient.setQueryData<{
              pages: { messages: ChatMessage[] }[];
              pageParams: (number | undefined)[];
            }>(chatKeys.messages(roomId).queryKey, (oldData) => {
              if (!oldData) return oldData;
              const newPages = oldData.pages.map((page) => ({
                ...page,
                messages: page.messages.filter((msg) => msg.id !== tempId),
              }));
              return { ...oldData, pages: newPages };
            });
          }
        },
      );
    },
    [
      socket,
      roomId,
      newMessage,
      currentUserId,
      currentUserHandle,
      currentUserNickname,
      currentUserProfileImageUrl,
      queryClient,
      cancelTyping,
    ],
  );

  if (isInactive) {
    return (
      <div className="p-4 border-t bg-white shrink-0">
        <div className="text-center text-sm text-gray-500 bg-gray-100 p-3 rounded-md">
          대화가 종료된 채팅방입니다.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t bg-white shrink-0">
      <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
        <Input
          value={newMessage}
          onChange={handleInputChange}
          placeholder="메시지를 입력하세요..."
          autoComplete="off"
          className="grow"
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
          <SendHorizontal size={20} />
        </Button>
      </form>
    </div>
  );
};
