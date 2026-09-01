import { chatKeys, ChatMessage, ChatMessageType, MAX_CHAT_IMAGES } from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { AnimatedSend } from "@/shared/components/icons/animated";
import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";
import { useSocketContext } from "@/shared/providers/socket-provider";
import { validateImageForUpload } from "@/shared/utils/compress-image";

import { uploadChatImages } from "../../../services/chat-image-upload-service";

interface ChatInputProps {
  roomId: number;
  currentUserId: number;
  currentUserHandle: string;
  currentUserNickname: string;
  currentUserProfileImageUrl?: string | null;
  isInactive: boolean;
  onTyping: () => void;
  cancelTyping: () => void;
}

/** 첨부 대기 중인 이미지 (미리보기 URL + 원본 파일) */
interface PendingImage {
  previewUrl: string;
  file: File;
}

/**
 * 채팅 입력 폼 컴포넌트입니다.
 * - 메시지 입력 및 전송 기능을 제공합니다.
 * - 이미지를 첨부하면 입력창 위에 미리보기가 표시되며, 텍스트와 함께 한 메시지로 전송됩니다.
 * - 전송 시 '낙관적 업데이트'를 통해 즉시 화면에 메시지를 표시합니다.
 * - 채팅방이 비활성화된 경우 입력 폼 대신 안내 메시지를 표시합니다.
 */
export const ChatInput = ({
  roomId,
  currentUserId,
  currentUserHandle,
  currentUserNickname,
  currentUserProfileImageUrl,
  isInactive,
  onTyping,
  cancelTyping,
}: ChatInputProps) => {
  const t = useTranslations("chat");
  const tCommon = useTranslations("common");
  const [newMessage, setNewMessage] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  // 언마운트 시 남아있는 미리보기 object URL 정리 (메모리 누수 방지)
  const pendingImagesRef = useRef<PendingImage[]>([]);
  pendingImagesRef.current = pendingImages;

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
    };
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);
      onTyping();
    },
    [onTyping],
  );

  const handleFilesSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      // 동일한 파일을 다시 선택할 수 있도록 입력값을 초기화합니다.
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (files.length === 0) return;

      setPendingImages((prev) => {
        const remaining = MAX_CHAT_IMAGES - prev.length;
        if (remaining <= 0) {
          toast.error(t("image.limit_exceeded", { max: MAX_CHAT_IMAGES }));
          return prev;
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

        return [...prev, ...accepted];
      });
    },
    [t, tCommon],
  );

  const handleRemoveImage = useCallback((index: number) => {
    setPendingImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSendMessage = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!socket || !roomId || isUploading) return;

      const messageContent = newMessage.trim();
      const imagesToSend = pendingImages;

      // 텍스트도 이미지도 없으면 전송하지 않습니다.
      if (!messageContent && imagesToSend.length === 0) return;

      let imageUrls: string[] = [];

      // 이미지가 있으면 먼저 업로드하고 URL을 확보합니다.
      if (imagesToSend.length > 0) {
        const { user, accessToken } = useAuthStore.getState();
        if (!user || !accessToken) {
          toast.error(t("toast.send_error", { error: "" }));
          return;
        }

        setIsUploading(true);
        try {
          imageUrls = await uploadChatImages(
            imagesToSend.map((image) => image.file),
            { provider: user.provider, id: user.id },
            roomId,
            accessToken,
          );
        } catch (error) {
          console.error("Chat image upload failed:", error);
          toast.error(t("image.upload_error"));
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const tempId = -Date.now(); // 임시 ID (음수로 서버 ID와 충돌 방지)

      // 낙관적 업데이트: 즉시 UI에 메시지 표시
      const optimisticMessage: ChatMessage = {
        id: tempId,
        content: messageContent,
        isRead: false,
        type: imageUrls.length > 0 ? ChatMessageType.IMAGE : ChatMessageType.TEXT,
        metadata: imageUrls.length > 0 ? { imageUrls } : null,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          handle: currentUserHandle,
          nickname: currentUserNickname,
          profileImageUrl: currentUserProfileImageUrl ?? null,
        },
        chatRoom: { id: roomId },
      };

      // 캐시에 낙관적 메시지 추가
      queryClient.setQueryData<{
        pages: { messages: ChatMessage[] }[];
        pageParams: (number | undefined)[];
      }>(chatKeys.messages(roomId).queryKey, (oldData) => {
        if (!oldData) return oldData;
        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          messages: [optimisticMessage, ...newPages[0].messages],
        };
        return { ...oldData, pages: newPages };
      });

      // 입력 필드 및 첨부 목록 초기화 (UX 개선)
      setNewMessage("");
      imagesToSend.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setPendingImages([]);
      cancelTyping();

      // 서버에 메시지 전송
      socket.emit(
        "sendMessage",
        { roomId, content: messageContent, imageUrls },
        (response: { status: string; error?: string }) => {
          if (response.status !== "ok") {
            console.error("Message failed to send:", response.error);
            toast.error(t("toast.send_error", { error: response.error || "" }));

            // 실패 시 낙관적 메시지 롤백
            queryClient.setQueryData<{
              pages: { messages: ChatMessage[] }[];
              pageParams: (number | undefined)[];
            }>(chatKeys.messages(roomId).queryKey, (oldData) => {
              if (!oldData) return oldData;
              const newPages = oldData.pages.map((page) => ({
                ...page,
                messages: page.messages.filter((msg) => msg.id !== tempId),
              }));
              return { ...oldData, pages: newPages };
            });
          }
        },
      );
    },
    [
      socket,
      roomId,
      newMessage,
      pendingImages,
      isUploading,
      currentUserId,
      currentUserHandle,
      currentUserNickname,
      currentUserProfileImageUrl,
      queryClient,
      cancelTyping,
      t,
    ],
  );

  if (isInactive) {
    return (
      <div className="p-4 border-t bg-white shrink-0">
        <div className="text-center text-sm text-gray-500 bg-gray-100 p-3 rounded-md">
          {t("closed_room")}
        </div>
      </div>
    );
  }

  const canAttachMore = pendingImages.length < MAX_CHAT_IMAGES;
  const canSend =
    !isUploading && (newMessage.trim().length > 0 || pendingImages.length > 0);

  return (
    <div className="p-4 border-t bg-white shrink-0">
      {/* 첨부 이미지 미리보기 */}
      {pendingImages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-3">
          {pendingImages.map((image, index) => (
            <div key={image.previewUrl} className="relative group">
              <Image
                src={image.previewUrl}
                alt={tCommon("aria.preview_image", { index: index + 1 })}
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 rounded-lg border border-stone-200 object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                disabled={isUploading}
                aria-label={tCommon("aria.delete_image", { index: index + 1 })}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-stone-800 p-0.5 text-white shadow-sm transition-colors hover:bg-stone-900 disabled:opacity-50"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAttachMore || isUploading}
          aria-label={t("aria.attach_image")}
          title={
            canAttachMore
              ? t("aria.attach_image")
              : t("image.limit_exceeded", { max: MAX_CHAT_IMAGES })
          }
          className="shrink-0 text-stone-500 hover:text-stone-900"
        >
          <ImagePlus size={18} aria-hidden="true" />
        </Button>

        <Input
          value={newMessage}
          onChange={handleInputChange}
          placeholder={t("input_placeholder")}
          aria-label={t("input_placeholder")}
          autoComplete="off"
          disabled={isUploading}
          className="grow"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label={t("aria.send_message")}
          className="transition-transform active:scale-95 cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <AnimatedSend
              size={18}
              animate={canSend ? "default" : false}
              animateOnHover={canSend}
              className="text-primary-foreground"
              aria-hidden="true"
            />
          )}
        </Button>
      </form>
    </div>
  );
};
