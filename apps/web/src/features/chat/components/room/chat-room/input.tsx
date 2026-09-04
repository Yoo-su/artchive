import { MAX_CHAT_IMAGES } from "@bookjeok/core";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { AnimatedSend } from "@/shared/components/icons/animated";
import { ImagePlus, Loader2, X } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Textarea } from "@/shared/components/shadcn/textarea";

import { useChatComposer } from "../../../hooks/use-chat-composer";

/** 입력창이 늘어날 수 있는 최대 높이 (약 5줄) */
const MAX_INPUT_HEIGHT_PX = 120;

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
 * - 여러 줄 입력 지원 (Enter 전송, Shift+Enter 줄바꿈)
 * - 첨부 이미지는 입력창 위에 미리보기로 표시되고 텍스트와 한 메시지로 전송
 * - 비활성 채팅방에서는 입력 폼 대신 안내 메시지 표시
 *
 * 상태와 전송 로직은 `useChatComposer`가 담당하고 이 컴포넌트는 렌더링만 맡습니다.
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    text,
    setText,
    pendingImages,
    attachFiles,
    removeImage,
    isUploading,
    uploadProgress,
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

  // 내용에 맞춘 입력창 높이 조절 (CSS field-sizing은 사파리/파이어폭스 미지원)
  // scrollHeight는 테두리를 제외한 높이지만 box-sizing이 border-box라
  // 테두리 두께를 더하지 않으면 한 줄 입력에도 스크롤바가 생김
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;

    const { borderTopWidth, borderBottomWidth } =
      window.getComputedStyle(element);
    const borderHeight =
      (parseFloat(borderTopWidth) || 0) + (parseFloat(borderBottomWidth) || 0);

    element.style.height = "auto";
    element.style.height = `${Math.min(
      element.scrollHeight + borderHeight,
      MAX_INPUT_HEIGHT_PX,
    )}px`;
  }, [text]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      onTyping();
    },
    [onTyping, setText],
  );

  const handleFilesSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      // 동일한 파일 재선택을 위한 입력값 초기화
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || e.shiftKey) return;

      // IME 조합 중의 Enter는 글자 확정 입력이므로 전송하지 않음
      // (전송 시 첫 글자가 잘림)
      if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;

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
        <div className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
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
                  aria-label={tCommon("aria.delete_image", {
                    index: index + 1,
                  })}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-stone-800 p-0.5 text-white shadow-sm transition-colors hover:bg-stone-900 disabled:opacity-50"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          {/* 업로드 진행률: 큰 이미지를 올릴 때 멈춘 것처럼 보이지 않게 합니다. */}
          {isUploading && (
            <div
              className="mt-2 h-1 w-full overflow-hidden rounded-full bg-stone-200"
              role="progressbar"
              aria-label={t("image.uploading")}
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-emerald-600 transition-[width] duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <form className="flex items-end gap-2" onSubmit={handleSubmit}>
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

        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("input_placeholder")}
          aria-label={t("input_placeholder")}
          autoComplete="off"
          disabled={isUploading}
          rows={1}
          // 최대 높이 초과 시에만 노출되는 슬림 스크롤바
          // (기본 스크롤바는 화살표 버튼 때문에 둥근 모서리가 잘림)
          className="grow min-h-9 resize-none py-2 leading-5 custom-scrollbar"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label={t("aria.send_message")}
          className="shrink-0 transition-transform active:scale-95 cursor-pointer"
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
