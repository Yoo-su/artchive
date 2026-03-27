import { talkToAiLibrarian } from "@bookjeok/api-client/llm";
import { TalkRequest, TalkResponse } from "@bookjeok/core/llm";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * AI 사서 대화 뮤테이션
 */
export const useTalkToAiLibrarianMutation = (
  client: AxiosInstance,
  options?: UseMutationOptions<TalkResponse, Error, TalkRequest>,
) => {
  return useMutation({
    mutationFn: (request: TalkRequest) => talkToAiLibrarian(client, request),
    ...options,
  });
};
