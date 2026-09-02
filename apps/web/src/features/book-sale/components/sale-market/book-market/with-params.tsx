"use client";

import { useBookSaleSearchParams } from "../../../hooks/use-book-sale-search-params";
import { BookMarket } from ".";

/**
 * URL 쿼리 파라미터를 읽어 BookMarket에 넘겨주는 래퍼.
 *
 * useSearchParams를 호출하는 유일한 지점이므로, 이 컴포넌트만 Suspense 경계
 * 안에 두면 나머지 트리는 서버에서 정상적으로 렌더링됩니다.
 */
export const BookMarketWithParams = () => {
  const { params, updateParams, resetParams } = useBookSaleSearchParams();

  return (
    <BookMarket params={params} onApply={updateParams} onReset={resetParams} />
  );
};
