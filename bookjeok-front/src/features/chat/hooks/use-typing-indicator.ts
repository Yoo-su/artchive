"use client";

import debounce from "lodash/debounce";
import throttle from "lodash/throttle";
import { useCallback, useEffect, useMemo } from "react";

import { useSocketContext } from "@/shared/providers/socket-provider";

// 타이핑 관련 상수
const TYPING_THROTTLE_MS = 3000;
const STOP_TYPING_DEBOUNCE_MS = 1500;

interface UseTypingIndicatorProps {
  roomId: number | null;
}

/**
 * 채팅방에서 타이핑 상태를 관리하는 커스텀 훅입니다.
 * 입력 시작/중지 이벤트를 서버에 전송하며, debounce/throttle을 적용합니다.
 */
export const useTypingIndicator = ({ roomId }: UseTypingIndicatorProps) => {
  const { socket } = useSocketContext();

  // 타이핑 중지 이벤트 전송
  const emitStopTyping = useCallback(() => {
    if (socket && roomId) {
      socket.emit("stopTyping", { roomId });
    }
  }, [socket, roomId]);

  // 디바운스된 타이핑 중지 함수
  const debouncedStopTyping = useMemo(
    () => debounce(emitStopTyping, STOP_TYPING_DEBOUNCE_MS),
    [emitStopTyping],
  );

  // 쓰로틀된 타이핑 시작 함수
  const emitStartTyping = useMemo(
    () =>
      throttle(
        () => {
          if (socket && roomId) {
            socket.emit("startTyping", { roomId });
          }
        },
        TYPING_THROTTLE_MS,
        { trailing: false },
      ),
    [socket, roomId],
  );

  // 입력 변경 시 호출할 핸들러
  const handleTyping = useCallback(() => {
    emitStartTyping();
    debouncedStopTyping();
  }, [emitStartTyping, debouncedStopTyping]);

  // 타이핑 관련 리소스 정리
  const cancelTyping = useCallback(() => {
    debouncedStopTyping.cancel();
    emitStartTyping.cancel();
    emitStopTyping();
  }, [debouncedStopTyping, emitStartTyping, emitStopTyping]);

  // cleanup
  useEffect(() => {
    return () => {
      debouncedStopTyping.cancel();
      emitStartTyping.cancel();
    };
  }, [debouncedStopTyping, emitStartTyping]);

  return {
    handleTyping,
    cancelTyping,
  };
};
