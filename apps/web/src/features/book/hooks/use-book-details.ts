"use client";

import { useEffect, useRef } from "react";

import { publicAxios } from "@/shared/libs/axios";

import { recordBookView } from "../apis";
import { useBookDetailQuery } from "../queries";
import { useRecentBookStore } from "../stores/use-recent-book-store";

/**
 * 특정 도서의 상세 정보 조회 및 관련 부수효과를 처리하는 통합 코디네이터 훅
 * - 상세 데이터 페칭 (React Query)
 * - 조회수 기록 API 호출 (24시간 중복 방지 캐싱 포함)
 * - 최근 본 도서 스토어 등록
 */
export const useBookDetails = (isbn: string) => {
  const queryResult = useBookDetailQuery(isbn);
  const { data: book, isSuccess } = queryResult;
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

  // 2. 최근 본 책 등록 부수효과
  useEffect(() => {
    if (isSuccess && book) {
      addRecentBook(book);
    }
  }, [isSuccess, book, addRecentBook]);

  return queryResult;
};
