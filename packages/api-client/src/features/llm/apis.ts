import { API_PATHS, TalkRequest, TalkResponse } from "@bookjeok/core";

import { privateApiClient } from "../../client";

/**
 * AI 사서에게 메시지를 보내고 응답을 받습니다.
 */
export const talkToAiLibrarian = async (
  requestData: TalkRequest,
): Promise<TalkResponse> => {
  const { data } = await privateApiClient.post(API_PATHS.llm.talk, requestData);
  return data;
};
