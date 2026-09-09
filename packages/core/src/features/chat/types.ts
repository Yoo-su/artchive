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

/** 낙관적 메시지의 전송 상태 (클라이언트 전용) */
export type ChatMessageSendState = "sending" | "failed";

// 채팅 메시지 타입
export interface ChatMessage {
  id: number;
  content: string;
  isRead: boolean;
  type?: ChatMessageType;
  metadata?: Record<string, any> | null;
  /**
   * 클라이언트가 전송 시 부여한 상관 ID (저장하지 않고 응답에만 포함).
   * 낙관적 메시지를 서버 응답과 짝지어 교체하는 데 사용합니다.
   */
  clientMessageId?: string;
  /** 미확정 낙관적 메시지의 전송 상태 (클라이언트 전용) */
  sendState?: ChatMessageSendState;
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
  /** 상대방이 읽은 마지막 메시지 ID (첫 페이지 응답에만 포함, 읽음 표시 초기값) */
  opponentLastReadMessageId?: number | null;
}

/**
 * 실시간 채팅 WebSocket 페이로드 타입
 */
export interface SendMessagePayload {
  roomId: number;
  content: string;
  /** 첨부 이미지 URL 목록 (비어있지 않으면 IMAGE 타입으로 저장) */
  imageUrls?: string[];
  /** 낙관적 메시지 교체용 상관 ID (서버가 그대로 반환) */
  clientMessageId?: string;
}

export interface TypingPayload {
  roomId: number;
}

/** 서버가 브로드캐스트하는 타이핑 상태 이벤트 */
export interface TypingEvent {
  roomId: number;
  nickname: string;
  isTyping: boolean;
}

/** 상대방이 메시지를 읽었을 때 브로드캐스트되는 이벤트 */
export interface MessagesReadEvent {
  roomId: number;
  /** 읽음 처리를 수행한 사용자 ID */
  userId: number;
  /** 해당 사용자가 읽은 마지막 메시지 ID */
  lastReadMessageId: number;
}

export interface MarkAsReadPayload {
  roomId: number;
}

export interface LeaveRoomPayload {
  roomId: number;
}
