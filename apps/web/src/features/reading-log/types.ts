import { BookInfo } from "../book/types";

export interface ReadingLog {
  id: string;
  userId: number;
  isbn: string;
  book: BookInfo; // 정규화된 도서 정보 객체 추가
  date: string; // YYYY-MM-DD 형식
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReadingLogParams {
  isbn: string;
  date: string;
  memo?: string;
}

export interface ReadingLogStats {
  monthlyCount: number;
  yearlyCount: number;
}

export interface ReadingLogListResponse {
  items: ReadingLog[];
  nextCursor: string | null;
}

export interface UpdateReadingLogParams {
  id: string;
  memo: string;
}
