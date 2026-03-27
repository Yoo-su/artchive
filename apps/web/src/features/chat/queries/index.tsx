import { ChatRoom } from "@bookjeok/core/chat";
import { useInfiniteChatMessagesQuery as useBaseInfiniteChatMessagesQuery, useMyChatRoomsQuery as useBaseMyChatRoomsQuery } from "@bookjeok/react-query/chat";
import { UseQueryOptions } from "@tanstack/react-query";

import { privateAxios } from "@/shared/libs/axios";

export type { ChatMessage, ChatRoom } from "@bookjeok/core/chat";

export const useMyChatRoomsQuery = (
  options?: Omit<UseQueryOptions<ChatRoom[]>, "queryKey" | "queryFn">,
) => useBaseMyChatRoomsQuery(privateAxios, options);

export const useInfiniteChatMessagesQuery = (roomId: number | null) =>
  useBaseInfiniteChatMessagesQuery(roomId, privateAxios);
