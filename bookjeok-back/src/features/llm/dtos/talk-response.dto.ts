import { Book } from '@/features/book/entities/book.entity';

export class TalkResponseDto {
  /**
   * AI의 응답 메시지 (질문 또는 추천 멘트)
   */
  message: string;

  /**
   * 대화가 종료되고 추천이 완료되었는지 여부
   * true일 경우 web에서 추천 결과를 보여줘야 함
   */
  isFinal: boolean;

  /**
   * 추천된 책 목록 (isFinal이 true일 때만 포함됨)
   */
  recommendedBooks?: Partial<Book>[];
}
