"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { useChatStore } from "../stores/use-chat-store";
import { ChatMessage, ChatRoom } from "../types";

type InfiniteMessagesData = {
  pages: { messages: ChatMessage[] }[];
  pageParams: (number | undefined)[];
};

export const useChatEvents = () => {
  const { socket, isConnected } = useSocketContext();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { isChatOpen, activeChatRoomId, setTyping, setRoomInactive } =
    useChatStore();

  useEffect(() => {
    // Only run if the user is logged in and the socket is connected
    if (!socket || !isConnected || !user) return;

    const handleNewMessage = (newMessage: ChatMessage) => {
      const roomId = newMessage.chatRoom.id;
      console.log("New message received:", newMessage);

      // Update the message list in the query cache
      queryClient.setQueryData<InfiniteMessagesData>(
        QUERY_KEYS.chatKeys.messages(roomId).queryKey,
        (oldData) => {
          if (!oldData) return oldData;
          const newPages = [...oldData.pages];
          // Add the new message to the first page
          newPages[0] = {
            ...newPages[0],
            messages: [newMessage, ...newPages[0].messages],
          };
          return { ...oldData, pages: newPages };
        }
      );

      // Update the chat room list in the query cache
      queryClient.setQueryData<ChatRoom[]>(
        QUERY_KEYS.chatKeys.rooms.queryKey,
        (oldRooms) => {
          if (!oldRooms) return [];

          const isChatVisible = isChatOpen && activeChatRoomId === roomId;

          const updatedRooms = oldRooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  lastMessage: newMessage,
                  // Only increment unread count if the chat room is not currently visible
                  unreadCount: isChatVisible
                    ? room.unreadCount // Or even set to 0 if we mark as read immediately
                    : (room.unreadCount || 0) + 1,
                }
              : room
          );

          // Sort rooms to bring the one with the new message to the top
          return updatedRooms.sort(
            (a, b) =>
              new Date(b.lastMessage?.createdAt ?? 0).getTime() -
              new Date(a.lastMessage?.createdAt ?? 0).getTime()
          );
        }
      );
    };

    const handleUserLeft = ({
      roomId,
      message,
    }: {
      roomId: number;
      message: ChatMessage;
    }) => {
      console.log(`User left room ${roomId}`);
      // Add system message to cache
      queryClient.setQueryData<InfiniteMessagesData>(
        QUERY_KEYS.chatKeys.messages(roomId).queryKey,
        (oldData) => {
          if (!oldData) return oldData;
          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            messages: [message, ...newPages[0].messages],
          };
          return { ...oldData, pages: newPages };
        }
      );
      // Set room as inactive in the store
      setRoomInactive(roomId, true);
    };

    const handleUserRejoined = ({
      roomId,
      message,
    }: {
      roomId: number;
      message: ChatMessage;
    }) => {
      console.log(`User rejoined room ${roomId}`);
      // Add system message to cache
      queryClient.setQueryData<InfiniteMessagesData>(
        QUERY_KEYS.chatKeys.messages(roomId).queryKey,
        (oldData) => {
          if (!oldData) return oldData;
          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            messages: [message, ...newPages[0].messages],
          };
          return { ...oldData, pages: newPages };
        }
      );
      // Set room back to active
      setRoomInactive(roomId, false);
      // Invalidate rooms query to get fresh participant data
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.chatKeys.rooms.queryKey,
      });
    };

    const handleTyping = ({
      nickname,
      isTyping,
    }: {
      nickname: string;
      isTyping: boolean;
    }) => {
      if (activeChatRoomId) {
        setTyping(activeChatRoomId, isTyping ? nickname : "");
      }
    };

    // Register event listeners
    socket.on("newMessage", handleNewMessage);
    socket.on("userLeft", handleUserLeft);
    socket.on("userRejoined", handleUserRejoined);
    socket.on("typing", handleTyping);

    // Clean up listeners on dismount
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userLeft", handleUserLeft);
      socket.off("userRejoined", handleUserRejoined);
      socket.off("typing", handleTyping);
    };
  }, [
    socket,
    isConnected,
    user,
    queryClient,
    isChatOpen,
    activeChatRoomId,
    setTyping,
    setRoomInactive,
  ]);
};
