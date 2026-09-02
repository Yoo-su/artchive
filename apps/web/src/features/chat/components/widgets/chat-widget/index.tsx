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
 * `scale`을 쓰지 않는 이유: 스케일이 걸린 큰 레이어는 사파리에서 프레임마다
 * 다시 래스터화됩니다. 이 위젯은 메시지 · 이미지가 가득한 큰 서브트리를 품고 있어
 * 그 비용이 열림 애니메이션 내내 그대로 드러납니다. 이동과 투명도만으로도
 * 시각적 인상은 같습니다.
 *
 * 닫힐 때는 애니메이션이 끝난 뒤 `visibility: hidden`으로만 감춥니다.
 * `display: none`은 레이아웃을 없애버려서 스크롤 위치(scrollHeight/scrollTop)가
 * 초기화되고, 다시 열 때 하단 고정 계산이 어긋납니다.
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
   * 한 번이라도 열어본 뒤에는 계속 마운트해 둡니다.
   *
   * 예전에는 닫을 때마다 위젯을 언마운트해서 말풍선과 첨부 이미지 DOM이 통째로
   * 사라졌다가 열 때 다시 만들어졌습니다. 크로미움은 디코딩한 이미지를 캐시에
   * 들고 있어 티가 덜 나지만, 웹킷(특히 iOS)은 디코딩 데이터를 훨씬 빨리 버려서
   * 열 때마다 전부 다시 디코딩합니다. 그래서 대화가 길거나 이미지가 많은 방일수록
   * 사파리에서만 다시 여는 순간이 눈에 띄게 버벅였습니다.
   *
   * 채팅을 한 번도 열지 않은 사용자는 아무것도 마운트하지 않습니다.
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
      // 닫혀 있는 동안에는 보조기술과 포인터 양쪽에서 완전히 빠집니다.
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
