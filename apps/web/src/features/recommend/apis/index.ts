import { talkToAiLibrarian as sharedTalkToAiLibrarian } from "@bookjeok/api-client";
import { TalkRequest, TalkResponse } from "@bookjeok/core";

import { privateAxios } from "@/shared/libs/axios";

/**
 * AI 사서에게 메시지를 보내고 응답을 받습니다.
 */
export const talkToAiLibrarian = async (
  requestData: TalkRequest,
): Promise<TalkResponse> => {
  return sharedTalkToAiLibrarian(privateAxios, requestData);
};
