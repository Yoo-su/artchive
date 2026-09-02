"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Card } from "@/shared/components/shadcn/card";
import { useBodyScrollLock } from "@/shared/hooks/use-body-scroll-lock";

import { useChatStore } from "../../../stores/use-chat-store";
import { ChatList } from "../../list/chat-list";
import { ChatRoom } from "../../room/chat-room";

/**
 * 위젯 열림/닫힘 애니메이션.
 *
 * `scale` 미사용: 스케일이 걸린 큰 레이어는 사파리에서 프레임마다 재래스터화되며
 * 메시지·이미지가 많은 이 위젯에서는 비용이 크므로 이동과 투명도로 대체합니다.
 * 닫을 때는 `visibility: hidden`만 적용합니다. `display: none`은 레이아웃을 제거해
 * 스크롤 위치가 초기화되고 재오픈 시 하단 고정 계산이 어긋납니다.
 */
const WIDGET_VARIANTS = {
  open: { opacity: 1, y: 0, visibility: "visible" as const },
  closed: {
    opacity: 0,
    y: 20,
    transitionEnd: { visibility: "hidden" as const },
  },
};

export const ChatWidget = () => {
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const activeChatRoomId = useChatStore((state) => state.activeChatRoomId);
  const [isMobile, setIsMobile] = useState(false);

  /**
   * 한 번 열린 뒤에는 계속 마운트 상태로 유지.
   *
   * 닫을 때마다 언마운트하면 말풍선·첨부 이미지 DOM이 제거되고, 웹킷(특히 iOS)은
   * 디코딩 데이터를 빠르게 폐기하므로 재오픈 시 전체 재디코딩으로 버벅입니다.
   * 채팅을 한 번도 열지 않은 사용자는 마운트하지 않습니다.
   */
  const [hasEverOpened, setHasEverOpened] = useState(false);
  useEffect(() => {
    if (isChatOpen) setHasEverOpened(true);
  }, [isChatOpen]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useBodyScrollLock(isChatOpen && isMobile);

  if (!hasEverOpened) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isChatOpen ? "open" : "closed"}
      variants={WIDGET_VARIANTS}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      // 닫힌 동안에는 보조기술·포인터 대상에서 제외
      aria-hidden={!isChatOpen}
      className={`fixed bottom-24 right-6 z-999 h-[70vh] w-[90vw] max-w-sm ${
        isChatOpen ? "" : "pointer-events-none"
      }`}
    >
      {/* Clarity 세션 녹화에서 채팅 내용 마스킹 */}
      <Card
        className="h-full w-full flex flex-col shadow-2xl overflow-hidden"
        data-clarity-mask="true"
      >
        {activeChatRoomId ? (
          <ChatRoom roomId={activeChatRoomId} />
        ) : (
          <ChatList />
        )}
      </Card>
    </motion.div>
  );
};
