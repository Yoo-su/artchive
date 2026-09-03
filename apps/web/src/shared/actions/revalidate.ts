"use server";

import { revalidatePath } from "next/cache";

import { routing } from "@/shared/config/i18n/routing";

/**
 * ISR(Full Route Cache)을 즉시 파괴하는 서버 액션
 *
 * 판매글·리뷰가 걸린 페이지는 ISR로 5분~1시간 캐시된다. 쓰기 직후 이 캐시를
 * 비우지 않으면 새로고침한 본인, 다른 방문자, 크롤러가 재검증 시각까지 옛 HTML을 받는다.
 * 클라이언트 쿼리 캐시 무효화는 서버 캐시에 닿지 않으므로 함께 호출해야 한다.
 *
 * ⚠️ 이 액션은 서버 캐시만 지운다. 브라우저가 들고 있는 Next.js Router Cache
 * (static 라우트 기본 5분)는 별개라, 호출한 쪽에서 `router.refresh()`도 함께 실행해야
 * 같은 세션에서의 SPA 재진입까지 최신 상태가 된다.
 */

/** 모든 로케일에 대해 같은 경로를 재검증 (localePrefix: "always") */
const revalidateAllLocales = (path: string) => {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}${path}`);
  }
};

/**
 * 판매글 변경 시 재검증 대상
 * - 판매글 상세, 마켓 목록, 최근 판매글이 실린 홈
 * - isbn을 알면 연관 판매글이 붙는 도서 상세까지
 */
export async function revalidateBookSale(params: {
  saleId?: number;
  isbn?: string;
}) {
  const { saleId, isbn } = params;

  if (saleId) revalidateAllLocales(`/book/sales/${saleId}`);
  if (isbn) revalidateAllLocales(`/book/${isbn}/detail`);
  revalidateAllLocales("/book/market");
  revalidateAllLocales("");
}

/**
 * 리뷰 변경 시 재검증 대상
 * - 리뷰 상세, 리뷰 목록, 최신 리뷰가 실린 홈
 */
export async function revalidateReview(params: { reviewId?: number }) {
  const { reviewId } = params;

  if (reviewId) revalidateAllLocales(`/book/reviews/${reviewId}`);
  revalidateAllLocales("/book/reviews");
  revalidateAllLocales("");
}
