import { MAX_CHAT_IMAGES } from "@bookjeok/core";
import { ImagePlus, Loader2, X } from "lucide-react";
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
 * - 여러 줄 입력을 지원합니다. Enter로 전송하고 Shift+Enter로 줄을 바꿉니다.
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

  // 내용에 맞춰 입력창 높이를 조절합니다.
  // CSS field-sizing은 아직 사파리/파이어폭스가 지원하지 않아 직접 계산합니다.
  //
  // scrollHeight는 테두리를 뺀 높이인데 box-sizing이 border-box라 height에는
  // 테두리가 포함됩니다. 그대로 대입하면 매 줄 테두리 두께만큼 모자라서
  // 한 줄짜리 입력에도 스크롤바가 계속 떠 있게 됩니다.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;

    const { borderTopWidth, borderBottomWidth } = window.getComputedStyle(element);
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || e.shiftKey) return;

      // 한글처럼 IME 조합이 필요한 언어에서 Enter는 글자를 확정하는 입력입니다.
      // 조합 중에는 전송하지 않아야 첫 글자가 잘려 나가지 않습니다.
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
                  aria-label={tCommon("aria.delete_image", { index: index + 1 })}
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
          // 최대 높이를 넘어 스크롤이 생길 때만 보이는 슬림 스크롤바.
          // 기본 스크롤바는 화살표 버튼이 붙어 나오면서 둥근 모서리를 잘라 먹습니다.
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
