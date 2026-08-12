import { Response } from 'express';

import { BookSearchResultDto } from '@/features/search/dtos/ai-search.dto';

export type SseEvent =
  | { type: 'searching'; message: string }
  | { type: 'books'; books: BookSearchResultDto[] }
  | { type: 'text'; chunk: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

/**
 * Express Response 객체를 래핑하여 SSE(Server-Sent Events) 스트림 전송을 캡슐화하는 어댑터
 */
export class SseStreamWriter {
  private isClosed = false;

  constructor(private readonly res: Response) {
    if (!this.res.headersSent) {
      this.res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      this.res.setHeader('Cache-Control', 'no-cache, no-transform');
      this.res.setHeader('Connection', 'keep-alive');
      this.res.setHeader('X-Accel-Buffering', 'no');
      this.res.flushHeaders?.();
    }
  }

  /**
   * SSE 데이터 패킷 전송
   */
  sendEvent(event: SseEvent): void {
    if (this.isClosed) return;
    this.res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  /**
   * 도서 탐색 중 안내 이벤트 전송
   */
  sendSearching(message: string): void {
    this.sendEvent({ type: 'searching', message });
  }

  /**
   * 도서 목록 선발송 이벤트 전송
   */
  sendBooks(books: BookSearchResultDto[]): void {
    this.sendEvent({ type: 'books', books });
  }

  /**
   * 텍스트 토큰 청크 전송
   */
  sendTextChunk(chunk: string): void {
    this.sendEvent({ type: 'text', chunk });
  }

  /**
   * 오류 메시지 전송 및 스트림 종료
   */
  sendError(message: string): void {
    this.sendEvent({ type: 'error', message });
    this.complete();
  }

  /**
   * 스트림 정상 완료 신호 전송 및 응답 종료
   */
  complete(): void {
    if (this.isClosed) return;
    this.sendEvent({ type: 'done' });
    this.res.end();
    this.isClosed = true;
  }
}
