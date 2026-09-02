"use client";

import {
  ChatMessage,
  ChatMessageType,
  MAX_CHAT_IMAGES,
} from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useSocketContext } from "@/shared/providers/socket-provider";
import { validateImageForUpload } from "@/shared/utils/compress-image";

import { SEND_ACK_TIMEOUT_MS } from "../constants/socket";
import { uploadChatImages } from "../services/chat-image-upload-service";
import {
  prependMessageToCache,
  setMessageSendState,
} from "../utils/chat-cache-utils";

/** 첨부 대기 중인 이미지 (미리보기 URL + 원본 파일) */
export interface PendingImage {
  previewUrl: string;
  file: File;
}

/**
 * 낙관적 메시지를 서버 응답과 짝짓기 위한 상관 ID를 생성합니다.
 * 서버는 저장하지 않고 그대로 되돌려주기만 합니다.
 */
const createClientMessageId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface UseChatComposerOptions {
  roomId: number;
  currentUserId: number;
  currentUserHandle: string;
  currentUserNickname: string;
  currentUserProfileImageUrl?: string | null;
  cancelTyping: () => void;
}

/**
 * 채팅 입력 영역의 상태와 전송 로직을 담당합니다.
 * 텍스트/첨부 이미지 관리, 업로드, 낙관적 업데이트, 소켓 전송을 처리하고
 * 컴포넌트에는 렌더링만 남깁니다.
 *
 * 전송 실패 시 메시지를 지우지 않고 실패 상태로 남깁니다. 재전송에 필요한 값은
 * 메시지 자체가 들고 있으므로(`useMessageRetry`) 입력창 상태에 의존하지 않습니다.
 * 첨부 목록은 `pendingImagesRef`가 기준이며 상태는 렌더링 용도로만 사용합니다.
 */
export const useChatComposer = ({
  roomId,
  currentUserId,
  currentUserHandle,
  currentUserNickname,
  currentUserProfileImageUrl,
  cancelTyping,
}: UseChatComposerOptions) => {
  const t = useTranslations("chat");
  const tCommon = useTranslations("common");
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  /** 업로드 진행률(0~100). 업로드 중이 아니면 0 */
  const [uploadProgress, setUploadProgress] = useState(0);

  // 상태 반영 전에도 정확한 값을 읽기 위한 첨부 목록의 최신 값
  const pendingImagesRef = useRef<PendingImage[]>([]);

  const updatePendingImages = useCallback((next: PendingImage[]) => {
    pendingImagesRef.current = next;
    setPendingImages(next);
  }, []);

  // 언마운트 시 남아있는 미리보기 object URL 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
    };
  }, []);

  /** 선택한 파일을 검증해 첨부 목록에 추가 */
  const attachFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const current = pendingImagesRef.current;
      const remaining = MAX_CHAT_IMAGES - current.length;

      if (remaining <= 0) {
        toast.error(t("image.limit_exceeded", { max: MAX_CHAT_IMAGES }));
        return;
      }

      const accepted: PendingImage[] = [];
      for (const file of files.slice(0, remaining)) {
        const validationError = validateImageForUpload(file, {
          onlyImage: tCommon("image.only_image_allowed"),
          sizeLimitExceeded: (size, maxSize) =>
            tCommon("image.size_limit_exceeded", { size, maxSize }),
        });

        if (validationError) {
          toast.error(validationError);
          continue;
        }

        accepted.push({ previewUrl: URL.createObjectURL(file), file });
      }

      if (files.length > remaining) {
        toast.error(t("image.limit_exceeded", { max: MAX_CHAT_IMAGES }));
      }

      if (accepted.length > 0) {
        updatePendingImages([...current, ...accepted]);
      }
    },
    [t, tCommon, updatePendingImages],
  );

  /** 첨부 목록에서 이미지 제거 */
  const removeImage = useCallback(
    (index: number) => {
      const current = pendingImagesRef.current;
      const target = current[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      updatePendingImages(current.filter((_, i) => i !== index));
    },
    [updatePendingImages],
  );

  const sendMessage = useCallback(async () => {
    if (!socket || !roomId || isUploading) return;

    const messageContent = text.trim();
    const imagesToSend = pendingImagesRef.current;

    // 텍스트와 이미지가 모두 없으면 전송하지 않음
    if (!messageContent && imagesToSend.length === 0) return;

    let imageUrls: string[] = [];

    if (imagesToSend.length > 0) {
      const { user, accessToken } = useAuthStore.getState();
      if (!user || !accessToken) {
        toast.error(t("toast.send_error", { error: "" }));
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      try {
        imageUrls = await uploadChatImages(
          imagesToSend.map((image) => image.file),
          { provider: user.provider, id: user.id },
          roomId,
          accessToken,
          { onProgress: setUploadProgress },
        );
      } catch (error) {
        console.error("Chat image upload failed:", error);
        toast.error(t("image.upload_error"));
        // 바로 재시도할 수 있도록 첨부는 유지
        return;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }

    const tempId = -Date.now(); // 임시 ID (음수로 서버 ID와 충돌 방지)
    const clientMessageId = createClientMessageId();

    // 낙관적 업데이트: 즉시 UI에 메시지 표시
    const optimisticMessage: ChatMessage = {
      id: tempId,
      content: messageContent,
      isRead: false,
      type: imageUrls.length > 0 ? ChatMessageType.IMAGE : ChatMessageType.TEXT,
      metadata: imageUrls.length > 0 ? { imageUrls } : null,
      clientMessageId,
      sendState: "sending",
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUserId,
        handle: currentUserHandle,
        nickname: currentUserNickname,
        profileImageUrl: currentUserProfileImageUrl ?? null,
      },
      chatRoom: { id: roomId },
    };

    prependMessageToCache(queryClient, roomId, optimisticMessage);

    // 입력 필드 및 첨부 목록 초기화
    // 말풍선은 업로드된 URL을 사용하므로 미리보기 object URL은 여기서 해제
    setText("");
    updatePendingImages([]);
    imagesToSend.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    cancelTyping();

    // 서버에 메시지 전송 (ack 미수신 대비 타임아웃 적용)
    socket
      .timeout(SEND_ACK_TIMEOUT_MS)
      .emit(
        "sendMessage",
        { roomId, content: messageContent, imageUrls, clientMessageId },
        (
          timeoutError: Error | null,
          response?: { status: string; error?: string },
        ) => {
          if (!timeoutError && response?.status === "ok") return;

          console.error(
            "Message failed to send:",
            timeoutError ?? response?.error,
          );
          toast.error(
            timeoutError
              ? t("toast.send_timeout")
              : t("toast.send_error", { error: response?.error || "" }),
          );

          // 그 자리에서 재전송할 수 있도록 실패 상태로 유지
          setMessageSendState(queryClient, roomId, clientMessageId, "failed");
        },
      );
  }, [
    socket,
    roomId,
    text,
    isUploading,
    currentUserId,
    currentUserHandle,
    currentUserNickname,
    currentUserProfileImageUrl,
    queryClient,
    cancelTyping,
    updatePendingImages,
    t,
  ]);

  return {
    text,
    setText,
    pendingImages,
    attachFiles,
    removeImage,
    isUploading,
    uploadProgress,
    sendMessage,
    canAttachMore: pendingImages.length < MAX_CHAT_IMAGES,
    canSend:
      !isUploading && (text.trim().length > 0 || pendingImages.length > 0),
  };
};
