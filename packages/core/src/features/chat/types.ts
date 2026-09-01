import { SaleAuthor, UsedBookSale } from "../book-sale/types";

export enum ChatMessageType {
  TEXT = "TEXT",
  SYSTEM = "SYSTEM",
  TRADE_STATUS = "TRADE_STATUS",
  TRADE_ACTION = "TRADE_ACTION",
  IMAGE = "IMAGE",
}

/** 한 메시지에 첨부할 수 있는 최대 이미지 개수 */
export const MAX_CHAT_IMAGES = 3;

/** IMAGE 타입 메시지의 metadata 구조 */
export interface ChatImageMetadata {
  imageUrls: string[];
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: number;
  content: string;
  isRead: boolean;
  type?: ChatMessageType;
  metadata?: Record<string, any> | null;
  createdAt: string; // ISO 8601
  sender: SaleAuthor | null;
  chatRoom: { id: number; usedBookSale?: UsedBookSale }; // 순환 참조를 피하기 위해 id 위주로 포함하되 필요 시 판매글 정보 허용
}

// 채팅 참여자 정보 타입
export interface ChatParticipantInfo {
  id?: number;
  isActive?: boolean;
  user: SaleAuthor;
}

// 채팅방 목록에 표시될 각 방의 정보 타입
export interface ChatRoom {
  id: number;
  createdAt: string;
  participants: ChatParticipantInfo[];
  usedBookSale: UsedBookSale; // 어떤 판매글에 대한 채팅인지
  lastMessage?: ChatMessage; // 마지막 메시지
  unreadCount?: number; // 안 읽은 메시지 수
}

export interface GetChatMessagesResponse {
  messages: ChatMessage[];
  hasNextPage: boolean;
  nextCursor?: number;
}

/**
 * 실시간 채팅 WebSocket 페이로드 타입
 */
export interface SendMessagePayload {
  roomId: number;
  content: string;
  /** 첨부 이미지 URL 목록. 비어있지 않으면 IMAGE 타입 메시지로 저장됩니다. */
  imageUrls?: string[];
}

export interface TypingPayload {
  roomId: number;
}

export interface MarkAsReadPayload {
  roomId: number;
}

export interface LeaveRoomPayload {
  roomId: number;
}

