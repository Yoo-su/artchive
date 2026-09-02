import { getReview } from "@bookjeok/api-client";
import { reviewKeys } from "@bookjeok/core";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { ReviewJsonLd } from "@/features/review/components/common/review-json-ld";
import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { getQueryClient } from "@/shared/libs/query-client";
import { ReviewDetailView } from "@/views/review-detail-view";

// 리뷰 내용은 자주 변경되지 않으므로 5분 간격으로 재검증
export const revalidate = 3600;

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

  const baseMeta = createPageMetadata({
    title,
    description,
    imageUrl: images[0],
    locale,
    path: `/book/reviews/${reviewId}`,
  });

  return {
    ...baseMeta,
    openGraph: {
      ...baseMeta.openGraph,
      type: "article",
    },
    // 비공개 리뷰는 본문이 마스킹되어 내려오므로 색인 대상에서 제외한다.
    // 제목은 기존대로 노출한다.
    ...(!review.isPublic && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const reviewId = Number(id);
  const queryClient = getQueryClient();

  // 캐시된 API 호출
  const review = await getCachedReview(reviewId);

  if (!review) {
    notFound();
  }

  // QueryClient에 데이터 설정
  queryClient.setQueryData(reviewKeys.detail(reviewId).queryKey, review);

  const t = await getTranslations({ locale, namespace: "header" });
  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_reviews"), url: `/${locale}/book/reviews` },
    { name: review.title, url: `/${locale}/book/reviews/${id}` },
  ];

  return (
    <ServerQueryBoundary queryClient={queryClient}>
      <ReviewJsonLd review={review} locale={locale} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ReviewDetailView initialReview={review} />
    </ServerQueryBoundary>
  );
}
