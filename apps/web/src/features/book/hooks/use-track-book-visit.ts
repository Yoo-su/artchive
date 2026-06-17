"use client";

import { BookInfo } from "@bookjeok/core";
import { useEffect, useRef } from "react";

import { publicAxios } from "@/shared/libs/axios";

import { recordBookView } from "../apis";
import { useRecentBookStore } from "../stores/use-recent-book-store";

/**
 * 도서 상세페이지 진입 트래킹을 처리하는 전용 훅 (부수효과 고립)
 * - 조회수 기록 API 호출 (StrictMode 이중 호출 및 24시간 중복 카운트 방어)
 * - 최근 본 도서 스토어 등록
 */
export const useTrackBookVisit = (isbn: string, book: BookInfo | null) => {
  const addRecentBook = useRecentBookStore((state) => state.addRecentBook);
  const lastCalledIsbnRef = useRef<string | null>(null);

  // 1. 조회수 기록 부수효과
  useEffect(() => {
    if (!isbn || lastCalledIsbnRef.current === isbn) {
      return;
    }

    lastCalledIsbnRef.current = isbn;

    recordBookView(publicAxios, isbn).catch((error) => {
      console.warn("책 조회수 기록 실패:", error);
    });
  }, [isbn]);

  // 2. 최근 본 책 등록 부수효과 (성공적으로 데이터를 가져왔을 때만 실행)
  useEffect(() => {
    if (book) {
      addRecentBook(book);
    }
  }, [book, addRecentBook]);
};
