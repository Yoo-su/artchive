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
 * 전송에 실패한 메시지를 그 자리에서 다시 보내거나 지웁니다.
 *
 * 재전송에 필요한 값(본문, 업로드된 이미지 URL, 상관 ID)이 실패한 메시지 자체에
 * 모두 들어 있으므로 입력창 상태에 기대지 않습니다. 이미지는 이미 업로드된
 * URL을 그대로 다시 실어 보내므로 재업로드가 일어나지 않습니다.
 */
export const useMessageRetry = (roomId: number) => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const t = useTranslations("chat");
  // 이 콜백들은 메모된 말풍선에 props로 내려갑니다.
  // 번역 함수를 의존성에 두면 참조가 바뀔 때마다 목록 전체가 다시 렌더링될 수
  // 있으므로 ref로 최신 값만 읽습니다.
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
