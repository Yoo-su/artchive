"use client";

import { MessageSquareX } from "lucide-react";
import { useEffect } from "react";

import { useSocketContext } from "@/shared/providers/socket-provider";

import { useMyChatRoomsQuery } from "../queries";
import { useChatStore } from "../stores/use-chat-store";
import { ChatItem } from "./chat-item";
import { ChatListSkeleton } from "./skeleton";

export const ChatList = () => {
  const { data: rooms, isLoading } = useMyChatRoomsQuery();
  const { socket, isConnected } = useSocketContext();
  const { hasJoinedRooms, setHasJoinedRooms } = useChatStore();

  useEffect(() => {
    if (socket && isConnected && rooms && rooms.length > 0 && !hasJoinedRooms) {
      const roomIds = rooms.map((room) => room.id);
      socket.emit(
        "joinRooms",
        roomIds,
        (response: { status: string; joinedRooms: number[] }) => {
          if (response.status === "ok") {
            console.log("Successfully joined rooms:", response.joinedRooms);
            setHasJoinedRooms(true);
          } else {
            console.error("Failed to join rooms");
          }
        }
      );
    }
  }, [socket, isConnected, rooms, hasJoinedRooms, setHasJoinedRooms]);

  if (isLoading) {
    return <ChatListSkeleton />;
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <MessageSquareX size={48} />
        <p className="mt-4">아직 대화가 없어요.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold">채팅 목록</h3>
      </div>
      <div className="flex-grow overflow-y-auto">
        {rooms.map((room) => (
          <ChatItem key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
};
