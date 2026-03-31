import { ChatRoom } from "@bookjeok/core";
import { useInfiniteChatMessagesQuery as useBaseInfiniteChatMessagesQuery, useMyChatRoomsQuery as useBaseMyChatRoomsQuery } from "@bookjeok/react-query";
import { UseQueryOptions } from "@tanstack/react-query";

import { privateAxios } from "@/shared/libs/axios";

export type { ChatMessage, ChatRoom } from "@bookjeok/core";

export const useMyChatRoomsQuery = (
  options?: Omit<UseQueryOptions<ChatRoom[]>, "queryKey" | "queryFn">,
) => useBaseMyChatRoomsQuery(privateAxios, options);

export const useInfiniteChatMessagesQuery = (roomId: number | null) =>
  useBaseInfiniteChatMessagesQuery(roomId, privateAxios);
