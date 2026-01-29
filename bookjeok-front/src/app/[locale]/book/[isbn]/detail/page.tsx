import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { bookKeys } from "@/features/book";
import { fetchBookDetail } from "@/features/book/apis/server";
import { prefetchRelatedBooks } from "@/features/book/queries/prefetch";
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
    if (!data.items || data.items.length === 0) {
      throw new Error(t("not_found"));
    }

    const book = data.items[0];

    return {
      title: book.title,
      description: t("description"),
    };
  } catch {
    return {
      title: t("title"),
      description: t("description"),
    };
  }
}

export default async function Page({ params }: Props) {
  const { locale, isbn } = await params;
  setRequestLocale(locale);

  const queryClient = getQueryClient();

  try {
    const data = await fetchBookDetail(isbn);
    if (data.items && data.items.length > 0) {
      const book = data.items[0];
      queryClient.setQueryData(bookKeys.detail(isbn).queryKey, book);

      // 저자 연관 도서 프리패칭
      await Promise.allSettled([
        book.author && prefetchRelatedBooks(queryClient, book.author),
      ]);
    }
  } catch {
    // API 호출 실패 시 조용한 처리
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookDetailView isbn={isbn} />
    </HydrationBoundary>
  );
}
