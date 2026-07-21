import { findOrCreateRoom as sharedFindOrCreateRoom, getChatMessages as sharedGetChatMessages, getMyChatRooms as sharedGetMyChatRooms, leaveChatRoom as sharedLeaveChatRoom, markMessagesAsRead as sharedMarkMessagesAsRead } from "@bookjeok/api-client";
import { ChatRoom, GetChatMessagesResponse } from "@bookjeok/core";

/**
 * 특정 판매글에 대한 채팅방을 찾거나 생성합니다.
 */
export const findOrCreateRoom = async (
  usedBookSaleId: number,
): Promise<ChatRoom> => {
  return sharedFindOrCreateRoom(usedBookSaleId);
};

/**
 * 현재 로그인한 유저의 모든 채팅방 목록을 조회합니다.
 * @returns 채팅방 목록
 */
export const getMyChatRooms = async (): Promise<ChatRoom[]> => {
  return sharedGetMyChatRooms();
};

/**
 * 특정 채팅방의 메시지 목록을 페이지네이션으로 조회합니다.
 * @param roomId 채팅방 ID
 * @param page 페이지 번호
 * @param limit 페이지 당 메시지 수
 * @returns 메시지 목록
 */
export const getChatMessages = async (
  roomId: number,
  page: number,
  limit: number = 20,
  cursorId?: number,
): Promise<GetChatMessagesResponse> => {
  return sharedGetChatMessages(roomId, page, limit, cursorId);
};

/**
 * 특정 채팅방의 메시지를 모두 읽음으로 처리합니다.
 * @param roomId 채팅방 ID
 */
export const markMessagesAsRead = async (roomId: number) => {
  return sharedMarkMessagesAsRead(roomId);
};

/**
 * 채팅방을 나갑니다.
 * @param roomId 나갈 채팅방의 ID
 */
export const leaveChatRoom = async (roomId: number) => {
  return sharedLeaveChatRoom(roomId);
};
