"use client";

import { FilterFormInputs, SearchBookSalesParams } from "@bookjeok/core";

import { BookSaleFilter } from "../book-sale-filter";
import { BookSaleGrid } from "../book-sale-grid";

interface BookMarketProps {
  /** URL에서 파싱된 검색 파라미터 */
  params: SearchBookSalesParams;
  /** 필터 적용 (생략 시 no-op, 프리렌더 fallback 용도) */
  onApply?: (data: FilterFormInputs) => void;
  /** 필터 초기화 (생략 시 no-op, 프리렌더 fallback 용도) */
  onReset?: () => void;
}

const noop = () => {};

/**
 * 중고책 마켓 메인 컴포넌트
 *
 * 정적 렌더링 라우트에서 useSearchParams를 호출하면 가장 가까운 Suspense 경계까지
 * 서버 렌더링이 생략되어 크롤러에 빈 목록이 전달되므로 URL 파라미터를 props로 받습니다.
 * URL 파싱은 BookMarketWithParams가 담당합니다.
 */
export const BookMarket = ({
  params,
  onApply = noop,
  onReset = noop,
}: BookMarketProps) => {
  return (
    <>
      <BookSaleFilter
        initialParams={params}
        onApply={onApply}
        onReset={onReset}
      />
      <BookSaleGrid filterParams={params} />
    </>
  );
};
