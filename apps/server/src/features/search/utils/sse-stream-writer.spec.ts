import { Response } from 'express';

import { SseStreamWriter } from './sse-stream-writer';

describe('SseStreamWriter', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      headersSent: false,
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      writableEnded: false,
      destroyed: false,
    };
  });

  it('should set SSE headers on instantiation', () => {
    new SseStreamWriter(mockRes as Response);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/event-stream; charset=utf-8',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-cache, no-transform',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
  });

  it('should send searching, text, books, and complete events correctly', () => {
    const sse = new SseStreamWriter(mockRes as Response);

    sse.sendSearching('도서 탐색 중');
    expect(mockRes.write).toHaveBeenCalledWith(
      'data: {"type":"searching","message":"도서 탐색 중"}\n\n',
    );

    sse.sendTextChunk('안녕하세요');
    expect(mockRes.write).toHaveBeenCalledWith(
      'data: {"type":"text","chunk":"안녕하세요"}\n\n',
    );

    sse.complete();
    expect(mockRes.write).toHaveBeenCalledWith('data: {"type":"done"}\n\n');
    expect(mockRes.end).toHaveBeenCalled();
  });
});
