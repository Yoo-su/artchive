import { API_PATHS } from "@/shared/constants/apis";
import { privateAxios } from "@/shared/libs/axios";

export interface TalkRequest {
  message: string;
  history?: string;
}

export interface TalkResponse {
  message: string;
  isFinal: boolean;
  recommendedBooks?: {
    title: string;
    author: string;
    publisher: string;
    description: string;
    image: string;
    isbn: string;
    pubdate: string;
  }[];
}

/**
 * AI 사서에게 메시지를 보내고 응답을 받습니다.
 */
export const talkToAiLibrarian = async (
  requestData: TalkRequest,
): Promise<TalkResponse> => {
  // privateAxios는 토큰이 있으면 헤더에 추가하고, 없으면 그냥 보냅니다. (Optional Auth 지원)
  const { data } = await privateAxios.post(API_PATHS.llm.talk, requestData);
  return data;
};
