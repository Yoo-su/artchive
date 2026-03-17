"use client";

import { useBookSaleSearchParams } from "../../../hooks/use-book-sale-search-params";
import { BookSaleFilter } from "../book-sale-filter";
import { BookSaleGrid } from "../book-sale-grid";

/**
 * 중고책 마켓 메인 컴포넌트
 * - useBookSaleSearchParams 훅으로 URL 파라미터 읽기/쓰기를 통합 관리
 */
export const BookMarket = () => {
  const { params, updateParams, resetParams } = useBookSaleSearchParams();

  return (
    <>
      <BookSaleFilter
        initialParams={params}
        onApply={updateParams}
        onReset={resetParams}
      />
      <BookSaleGrid filterParams={params} />
    </>
  );
};
