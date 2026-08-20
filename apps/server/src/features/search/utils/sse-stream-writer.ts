import { AiSearchBookItem, AiSearchSseEvent } from '@bookjeok/core';
import { Response } from 'express';

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

    this.res.on('close', () => {
      this.isClosed = true;
    });
  }

  /**
   * 클라이언트와 SSE 연결이 여전히 유효한지 확인
   */
  get isConnected(): boolean {
    return !this.isClosed && !this.res.writableEnded && !this.res.destroyed;
  }

  /**
   * SSE 데이터 패킷 전송
   */
  sendEvent(event: AiSearchSseEvent): void {
    if (!this.isConnected) return;
    try {
      this.res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      this.isClosed = true;
    }
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
  sendBooks(books: AiSearchBookItem[]): void {
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
    try {
      this.res.end();
    } catch {
      // 이미 닫힌 경우 무시
    }
    this.isClosed = true;
  }
}
