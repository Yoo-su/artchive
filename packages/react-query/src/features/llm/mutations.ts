import { talkToAiLibrarian } from "@bookjeok/api-client";
import { TalkRequest, TalkResponse } from "@bookjeok/core";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

/**
 * AI 사서 대화 뮤테이션
 */
export const useTalkToAiLibrarianMutation = (
  options?: UseMutationOptions<TalkResponse, Error, TalkRequest>,
) => {
  return useMutation({
    mutationFn: (request: TalkRequest) => talkToAiLibrarian(request),
    ...options,
  });
};
