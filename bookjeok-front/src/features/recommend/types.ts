/**
 * AI 사서가 추천해주는 책 정보 타입
 * - 실제 책 데이터가 아닌 LLM이 생성한 텍스트 기반 정보입니다.
 */
export interface RecommendedBook {
  title: string;
  author: string;
  description: string;
}
