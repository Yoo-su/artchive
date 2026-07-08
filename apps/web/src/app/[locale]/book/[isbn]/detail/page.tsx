import { bookKeys } from "@bookjeok/core";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { fetchBookDetail } from "@/features/book/apis/server";
import { BookJsonLd } from "@/features/book/components/common/book-json-ld";
import { prefetchBookSummary, prefetchRelatedBooks } from "@/features/book/queries/prefetch";
import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookDetailView } from "@/views/book-detail-view";

// 책 정보는 변경되지 않으므로 24시간 캐시
export const revalidate = 86400; // 24시간 (60 * 60 * 24)

type Props = {
  params: Promise<{ locale: string; isbn: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { isbn, locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "book.detail.metadata",
  });

  try {
    const data = await fetchBookDetail(isbn);
    // items가 없거나 비어있는 경우 처리
    if (!data || !data.items || data.items.length === 0) {
      throw new Error(t("not_found"));
    }

    const book = data.items[0];

    const title =
      book.title.length > 50 ? `${book.title.slice(0, 50)}...` : book.title;

    const description = book.description
      ? book.description.slice(0, 160) +
        (book.description.length > 160 ? "..." : "")
      : t("description");

    return createPageMetadata({
      title,
      description,
      imageUrl: book.image || null,
      locale,
      path: `/book/${isbn}/detail`,
    });
  } catch {
    return createPageMetadata({
      title: t("title"),
      description: t("description"),
      locale,
      path: `/book/${isbn}/detail`,
    });
  }
}

export default async function Page({ params }: Props) {
  const { locale, isbn } = await params;
  setRequestLocale(locale);

  const queryClient = getQueryClient();
  let book = null;

  try {
    const data = await fetchBookDetail(isbn);
    if (data && data.items && data.items.length > 0) {
      book = data.items[0];
      queryClient.setQueryData(bookKeys.detail(isbn).queryKey, book);

      // 저자 연관 도서 및 AI 요약 프리패칭
      await Promise.allSettled([
        book.author && prefetchRelatedBooks(queryClient, book.author),
        prefetchBookSummary(queryClient, isbn),
      ]);
    }
  } catch {
    // API 호출 실패 시 조용한 처리
  }

  if (!book) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "header" });
  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_search"), url: `/${locale}/book/search` },
    { name: book.title, url: `/${locale}/book/${isbn}/detail` },
  ];

  return (
    <ServerQueryBoundary queryClient={queryClient}>
      <BookJsonLd book={book} locale={locale} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <BookDetailView isbn={isbn} />
    </ServerQueryBoundary>
  );
}
