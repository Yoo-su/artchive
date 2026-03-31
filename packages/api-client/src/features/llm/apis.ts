import { API_PATHS, TalkRequest, TalkResponse } from "@bookjeok/core";
import { AxiosInstance } from "axios";

/**
 * AI 사서에게 메시지를 보내고 응답을 받습니다.
 */
export const talkToAiLibrarian = async (
  client: AxiosInstance,
  requestData: TalkRequest,
): Promise<TalkResponse> => {
  const { data } = await client.post(API_PATHS.llm.talk, requestData);
  return data;
};
