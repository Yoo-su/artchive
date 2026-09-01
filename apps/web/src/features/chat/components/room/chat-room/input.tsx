import { MAX_CHAT_IMAGES } from "@bookjeok/core";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChangeEvent, FormEvent, useCallback, useRef } from "react";

import { AnimatedSend } from "@/shared/components/icons/animated";
import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";

import { useChatComposer } from "../../../hooks/use-chat-composer";

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

/**
 * 채팅 입력 폼 컴포넌트입니다.
 * - 메시지 입력 및 전송 기능을 제공합니다.
 * - 이미지를 첨부하면 입력창 위에 미리보기가 표시되며, 텍스트와 함께 한 메시지로 전송됩니다.
 * - 채팅방이 비활성화된 경우 입력 폼 대신 안내 메시지를 표시합니다.
 *
 * 상태와 전송 로직은 `useChatComposer`가 담당하고, 이 컴포넌트는 렌더링만 맡습니다.
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    text,
    setText,
    pendingImages,
    attachFiles,
    removeImage,
    isUploading,
    sendMessage,
    canAttachMore,
    canSend,
  } = useChatComposer({
    roomId,
    currentUserId,
    currentUserHandle,
    currentUserNickname,
    currentUserProfileImageUrl,
    cancelTyping,
  });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
      onTyping();
    },
    [onTyping, setText],
  );

  const handleFilesSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      // 동일한 파일을 다시 선택할 수 있도록 입력값을 초기화합니다.
      if (fileInputRef.current) fileInputRef.current.value = "";
      attachFiles(files);
    },
    [attachFiles],
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void sendMessage();
    },
    [sendMessage],
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
                onClick={() => removeImage(index)}
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

      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
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
          value={text}
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
