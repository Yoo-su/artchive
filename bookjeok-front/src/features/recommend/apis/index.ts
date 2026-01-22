import { API_PATHS } from "@/shared/constants/apis";
import { publicAxios } from "@/shared/libs/axios";

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
  data: TalkRequest,
): Promise<TalkResponse> => {
  const response = await publicAxios.post("/llm/talk", data);
  return response.data;
};
