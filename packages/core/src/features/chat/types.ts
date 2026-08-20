import { SaleAuthor, UsedBookSale } from "../book-sale/types";

// 채팅 메시지 타입
export interface ChatMessage {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string; // ISO 8601
  sender: SaleAuthor | null;
  chatRoom: { id: number }; // 순환 참조를 피하기 위해 id만 포함
}

// 채팅방 목록에 표시될 각 방의 정보 타입
export interface ChatRoom {
  id: number;
  createdAt: string;
  participants: { user: SaleAuthor }[];
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

