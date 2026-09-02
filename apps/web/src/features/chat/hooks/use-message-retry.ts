"use client";

import { ChatMessage } from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

import { useSocketContext } from "@/shared/providers/socket-provider";

import { SEND_ACK_TIMEOUT_MS } from "../constants/socket";
import {
  removeMessageFromCache,
  setMessageSendState,
} from "../utils/chat-cache-utils";
import { getMessageImageUrls } from "../utils/chat-message-utils";

/**
 * 전송에 실패한 메시지를 그 자리에서 재전송하거나 삭제합니다.
 * 재전송에 필요한 값(본문, 업로드된 이미지 URL, 상관 ID)은 메시지 자체가 들고 있어
 * 입력창 상태에 의존하지 않으며, 이미지도 재업로드 없이 기존 URL을 재사용합니다.
 */
export const useMessageRetry = (roomId: number) => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const t = useTranslations("chat");
  // 메모된 말풍선에 props로 내려가는 콜백이라, 번역 함수를 의존성에 두면
  // 참조 변경 시 목록 전체가 리렌더된다. ref로 최신 값만 참조
  const tRef = useRef(t);
  tRef.current = t;

  const retryMessage = useCallback(
    (message: ChatMessage) => {
      const { clientMessageId } = message;
      if (!socket || !clientMessageId) return;

      setMessageSendState(queryClient, roomId, clientMessageId, "sending");

      socket
        .timeout(SEND_ACK_TIMEOUT_MS)
        .emit(
          "sendMessage",
          {
            roomId,
            content: message.content,
            imageUrls: getMessageImageUrls(message),
            clientMessageId,
          },
          (
            timeoutError: Error | null,
            response?: { status: string; error?: string },
          ) => {
            if (!timeoutError && response?.status === "ok") return;

            console.error(
              "Message retry failed:",
              timeoutError ?? response?.error,
            );
            toast.error(
              timeoutError
                ? tRef.current("toast.send_timeout")
                : tRef.current("toast.send_error", {
                    error: response?.error || "",
                  }),
            );
            setMessageSendState(queryClient, roomId, clientMessageId, "failed");
          },
        );
    },
    [socket, queryClient, roomId],
  );

  const discardMessage = useCallback(
    (message: ChatMessage) => {
      removeMessageFromCache(queryClient, roomId, message.id);
    },
    [queryClient, roomId],
  );

  return { retryMessage, discardMessage };
};
