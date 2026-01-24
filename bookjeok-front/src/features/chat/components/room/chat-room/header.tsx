import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, LogOut } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { toast } from "sonner";

import { chatKeys } from "@/features/chat";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import { useSocketContext } from "@/shared/providers/socket-provider";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { useChatStore } from "../../../stores/use-chat-store";
import { ChatRoom } from "../../../types";

interface ChatRoomHeaderProps {
  room: ChatRoom;
  opponentNickname?: string;
  opponentProfileImageUrl?: string | null;
  typingNickname?: string;
}

/**
 * 채팅방 헤더 컴포넌트입니다.
 * - 뒤로가기 버튼, 상대방 프로필 및 닉네임, 책 정보 이미지를 표시합니다.
 * - 상대방이 입력 중일 때 '입력 중...' 타이핑 인디케이터를 보여줍니다.
 * - 채팅방 나가기 기능을 제공합니다.
 */
export const ChatRoomHeader = ({
  room,
  opponentNickname,
  opponentProfileImageUrl,
  typingNickname,
}: ChatRoomHeaderProps) => {
  const { closeChatRoom, activeChatRoomId } = useChatStore();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  const handleLeaveRoom = useCallback(() => {
    if (
      !socket ||
      !activeChatRoomId ||
      !window.confirm("정말로 이 채팅방을 나가시겠습니까?")
    ) {
      return;
    }

    socket.emit(
      "leaveRoom",
      { roomId: activeChatRoomId },
      (response: { status: string; error?: string }) => {
        if (response.status === "ok") {
          queryClient.invalidateQueries({
            queryKey: chatKeys.rooms.queryKey,
          });
          closeChatRoom();
        } else {
          toast.error(`채팅방을 나가는 데 실패했습니다: ${response.error}`);
        }
      },
    );
  }, [socket, activeChatRoomId, queryClient, closeChatRoom]);

  return (
    <div className="flex items-center justify-between p-4 border-b shrink-0">
      <div className="flex items-center gap-4 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={closeChatRoom}
          aria-label="채팅방 닫기"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="relative h-10 w-10 shrink-0">
          <Image
            src={room.usedBookSale.book.image}
            alt={room.usedBookSale.book.title}
            fill
            className="rounded-md object-cover"
          />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-2">
            {opponentProfileImageUrl && (
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={getProfileImageUrl(opponentProfileImageUrl)}
                />
                <AvatarFallback>{opponentNickname?.slice(0, 1)}</AvatarFallback>
              </Avatar>
            )}
            <p className="font-semibold truncate">{opponentNickname}</p>
          </div>
          <div className="h-5">
            <AnimatePresence>
              {typingNickname && (
                <motion.p
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-emerald-600 truncate"
                >
                  {typingNickname}님이 입력 중...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:bg-red-50"
        onClick={handleLeaveRoom}
        aria-label="채팅방 나가기"
      >
        <LogOut size={20} />
      </Button>
    </div>
  );
};
