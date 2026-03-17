export interface ReadingLog {
  id: string;
  userId: number;
  bookIsbn: string;
  bookTitle: string;
  bookImage: string;
  bookAuthor: string;
  date: string; // YYYY-MM-DD 형식
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReadingLogParams {
  bookIsbn: string;
  bookTitle: string;
  bookImage: string;
  bookAuthor: string;
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
