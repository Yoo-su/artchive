import { BookInfo } from "../book/types";

export interface ReadingLog {
  id: string;
  userId: number;
  isbn: string;
  book: BookInfo;
  date: string; // YYYY-MM-DD
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
