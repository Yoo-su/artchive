import { ChatMessage, ChatMessageType } from "@bookjeok/core";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { RefObject, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { ImageLightbox } from "@/shared/components/ui/image-lightbox";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import {
  getMessageImageUrls,
  hasMessageText,
} from "../../../utils/chat-message-utils";
import { TradeMessageCard } from "../../trade/trade-message-card";

/** 시스템 메시지 버블 */
const SystemMessageBubble = ({ content }: { content: string }) => (
  <div className="text-center text-xs text-gray-500 py-2">
    <span>{content}</span>
  </div>
);

/** 메시지 버블 내 첨부 이미지 그리드. 클릭 시 라이트박스를 엽니다. */
const MessageImages = ({
  imageUrls,
  isSending,
}: {
  imageUrls: string[];
  isSending: boolean;
}) => {
  const t = useTranslations("common");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className={`grid w-full gap-1 ${imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {imageUrls.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => setLightboxIndex(index)}
            disabled={isSending}
            aria-label={t("aria.preview_image", { index: index + 1 })}
            className="relative aspect-square overflow-hidden rounded-lg bg-stone-100 transition-opacity hover:opacity-90 disabled:cursor-default"
          >
            <Image
              src={url}
              alt={t("aria.preview_image", { index: index + 1 })}
              fill
              unoptimized
              sizes="208px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <ImageLightbox
        images={imageUrls}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      />
    </>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  currentUserId?: number;
}

/** 메시지 버블 */
const MessageBubble = ({ message, isMine, currentUserId }: MessageBubbleProps) => {
  // 거래 관련 시스템 카드 메시지
  if (
    message.type === ChatMessageType.TRADE_STATUS ||
    message.type === ChatMessageType.TRADE_ACTION
  ) {
    return <TradeMessageCard message={message} currentUserId={currentUserId} />;
  }

  // 일반 시스템 메시지
  if (!message.sender || message.type === ChatMessageType.SYSTEM) {
    return <SystemMessageBubble content={message.content} />;
  }

  // 음수 ID는 전송 중인 낙관적 메시지
  const isSending = message.id < 0;
  const imageUrls = getMessageImageUrls(message);
  const hasImages = imageUrls.length > 0;
  const hasText = hasMessageText(message);

  return (
    <div
      className={`flex items-end gap-2 ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      {!isMine && (
        <Avatar className="h-8 w-8" data-nosnippet>
          <AvatarImage
            src={getProfileImageUrl(message.sender.profileImageUrl)}
          />
          <AvatarFallback>{message.sender.nickname.slice(0, 1)}</AvatarFallback>
        </Avatar>
      )}
      {/* 내 메시지일 때 전송 상태를 버블 왼쪽에 표시 */}
      {isMine && (
        <div className="flex items-end mb-1">
          {isSending ? (
            <motion.div
              className="flex gap-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 h-1 bg-gray-400 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Check className="w-3 h-3 text-emerald-600" />
            </motion.div>
          )}
        </div>
      )}
      <div
        className={`max-w-[70%] rounded-2xl ${hasImages ? "w-52 p-1.5" : "px-4 py-2"} ${
          isMine
            ? "bg-emerald-700 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        } ${isSending ? "opacity-70" : ""}`}
      >
        {hasImages && (
          <MessageImages imageUrls={imageUrls} isSending={isSending} />
        )}
        {hasText && (
          <p
            className={`text-sm ${hasImages ? "px-2.5 pb-1 pt-2" : ""}`}
            data-clarity-mask="true"
          >
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
};

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: number;
  isFetchingPreviousPage: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messageContainerRef: RefObject<HTMLDivElement | null>;
  contentRef?: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

/**
 * 메시지 목록을 표시하는 컴포넌트입니다.
 * - `MessageBubble` 컴포넌트를 사용하여 개별 메시지를 렌더링합니다.
 * - 무한 스크롤 기능을 지원하며, 스크롤이 상단에 도달하면 이전 메시지를 불러옵니다.
 * - 로딩 시 `Loader2` 스피너를 표시합니다.
 */
export const MessageList = ({
  messages,
  currentUserId,
  isFetchingPreviousPage,
  messagesEndRef,
  messageContainerRef,
  contentRef,
  onScroll,
}: MessageListProps) => {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className="grow overflow-y-auto p-4 custom-scrollbar stable-scroll"
      ref={messageContainerRef}
      onScroll={onScroll}
    >
      <div ref={contentRef} className="space-y-4">
        {isFetchingPreviousPage && (
          <div className="text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isMine={message.sender?.id === currentUserId}
            currentUserId={currentUserId}
          />
        ))}
        <div ref={messagesEndRef} className="h-2 shrink-0 pointer-events-none" />
      </div>
    </div>
  );
};
