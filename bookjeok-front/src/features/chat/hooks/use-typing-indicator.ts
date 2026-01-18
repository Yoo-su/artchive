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
 * - throttle: 타이핑 시작 이벤트('./startTyping')를 과도하게 보내지 않도록 조절합니다 (3초 간격).
 * - debounce: 타이핑이 멈춘 후 일정 시간(1.5초) 뒤에 중지 이벤트('stopTyping')를 보냅니다.
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
