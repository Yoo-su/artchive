import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { reviewKeys } from "@/features/review";
import { getReview } from "@/features/review/apis";
import { ReviewJsonLd } from "@/features/review/components/common/review-json-ld";
import { getQueryClient } from "@/shared/libs/query-client";
import { ReviewDetailView } from "@/views/review-detail-view";

// 리뷰 내용은 자주 변경되지 않으므로 5분 간격으로 재검증
export const revalidate = 300;

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

// React.cache를 사용하여 API 요청 중복 제거 (Request Memoization)
// 존재하지 않는 리뷰 조회 시 null 반환
const getCachedReview = cache(async (id: number) => {
  try {
    return await getReview(id);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { locale } = await params;
  const reviewId = Number(id);
  const t = await getTranslations({ locale, namespace: "review.detail" });

  const review = await getCachedReview(reviewId);

  if (!review) {
    return {
      title: t("not_found"),
      description: t("not_found"),
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = review.title;
  const description = `${review.book.title} - ${review.book.author}`;
  const images = review.book.image ? [review.book.image] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    alternates: {
      canonical: `https://bookjeok.com/book/reviews/${reviewId}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const reviewId = Number(id);
  const queryClient = getQueryClient();

  // 캐시된 API 호출
  const review = await getCachedReview(reviewId);

  // QueryClient에 데이터 설정
  if (review) {
    queryClient.setQueryData(reviewKeys.detail(reviewId).queryKey, review);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {review && <ReviewJsonLd review={review} />}
      <ReviewDetailView initialReview={review} />
    </HydrationBoundary>
  );
}
