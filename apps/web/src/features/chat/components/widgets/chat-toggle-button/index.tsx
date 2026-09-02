"use client";

import { ChatRoom } from "@bookjeok/core";
import { useMyChatRoomsQuery } from "@bookjeok/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { MessagesSquare, X } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/shared/components/shadcn/button";

import { useChatStore } from "../../../stores/use-chat-store";

/**
 * 목록 캐시는 메시지가 올 때마다 새 배열로 교체되지만, 이 버튼에 필요한 값은
 * 안 읽음 합계 하나뿐입니다. `select`로 숫자만 구독해 합계가 실제로 달라졌을
 * 때만 다시 렌더링되게 합니다.
 */
const selectTotalUnreadCount = (rooms: ChatRoom[]) =>
  rooms.reduce((acc, room) => acc + (room.unreadCount || 0), 0);

export const ChatToggleButton = () => {
  const toggleChat = useChatStore((state) => state.toggleChat);
  const isChatOpen = useChatStore((state) => state.isChatOpen);

  const select = useCallback(selectTotalUnreadCount, []);
  const { data: totalUnreadCount = 0 } = useMyChatRoomsQuery({ select });

  return (
    <div className="fixed bottom-4 right-6 z-50">
      <AnimatePresence>
        {totalUnreadCount > 0 && !isChatOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute -top-1 -right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg"
          >
            {totalUnreadCount}
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        size="icon"
        className="h-14 w-14 rounded-full bg-emerald-700 text-white shadow-2xl transition-transform duration-300 hover:scale-110 hover:bg-emerald-800"
        onClick={toggleChat}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={isChatOpen ? "x" : "chat"}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            {isChatOpen ? <X size={28} /> : <MessagesSquare size={28} />}
          </motion.div>
        </AnimatePresence>
      </Button>
    </div>
  );
};
