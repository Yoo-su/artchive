import { BookSortParam } from "./types";

export const HOME_PUBLISHERS = [
  "민음사",
  "문학동네",
  "열린책들",
  "은행나무",
  "다산책방",
];

export const RECENT_BOOKS_KEY = "recent-books";

// 도서 목록 기본 설정
export const DEFAULT_DISPLAY = 20;
export const DEFAULT_START = 1;
export const DEFAULT_SORT: BookSortParam = "sim";
