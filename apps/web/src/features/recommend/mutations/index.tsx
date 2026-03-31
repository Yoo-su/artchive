import { useTalkToAiLibrarianMutation as useBaseTalkToAiLibrarianMutation } from "@bookjeok/react-query";

import { privateAxios } from "@/shared/libs/axios";

/**
 * AI 사서 대화 뮤테이션 (인증 필요)
 */
export const useTalkToAiLibrarianMutation = () =>
  useBaseTalkToAiLibrarianMutation(privateAxios);
