import { API_PATHS, ChatRoom, GetChatMessagesResponse } from "@bookjeok/core";

import { privateApiClient } from "../../client";

/**
 * 특정 판매글에 대한 채팅방을 찾거나 생성합니다.
 */
export const findOrCreateRoom = async (saleId: number): Promise<ChatRoom> => {
  const { data } = await privateApiClient.post<ChatRoom>(API_PATHS.chat.rooms, {
    saleId,
  });
  return data;
};

/**
 * 현재 로그인한 유저의 모든 채팅방 목록을 조회합니다.
 */
export const getMyChatRooms = async (): Promise<ChatRoom[]> => {
  const { data } = await privateApiClient.get<ChatRoom[]>(API_PATHS.chat.rooms);
  return data;
};

/**
 * 특정 채팅방의 메시지 목록을 페이지네이션으로 조회합니다.
 */
export const getChatMessages = async (
  roomId: number,
  page: number,
  limit: number = 20,
  cursorId?: number,
): Promise<GetChatMessagesResponse> => {
  const { data } = await privateApiClient.get<GetChatMessagesResponse>(
    API_PATHS.chat.messages(roomId),
    { params: { page, limit, cursorId } },
  );
  return data;
};

/**
 * 특정 채팅방의 메시지를 모두 읽음으로 처리합니다.
 */
export const markMessagesAsRead = async (roomId: number) => {
  const { data } = await privateApiClient.patch(API_PATHS.chat.read(roomId));
  return data;
};

/**
 * 채팅방을 나갑니다.
 */
export const leaveChatRoom = async (roomId: number) => {
  const { data } = await privateApiClient.delete(API_PATHS.chat.room(roomId));
  return data;
};
