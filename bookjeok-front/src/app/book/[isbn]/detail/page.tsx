import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { fetchBookDetail } from "@/features/book/server/service";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookDetailView } from "@/views/book-detail-view";

// 책 정보는 변경되지 않으므로 24시간 캐시
export const revalidate = 86400; // 24시간 (60 * 60 * 24)

type Props = {
  params: Promise<{ isbn: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { isbn } = await params;

  try {
    const data = await fetchBookDetail(isbn);
    // items가 없거나 비어있는 경우 처리
    if (!data.items || data.items.length === 0) {
      throw new Error("책 정보가 없습니다.");
    }

    const book = data.items[0];

    return {
      title: book.title,
      description: "도서 상세 정보를 확인하세요.",
    };
  } catch {
    return {
      title: "도서 상세",
      description: "도서 상세 정보를 확인하세요.",
    };
  }
}

export default async function Page({ params }: Props) {
  const { isbn } = await params;
  const queryClient = getQueryClient();

  try {
    const data = await fetchBookDetail(isbn);
    if (data.items && data.items.length > 0) {
      queryClient.setQueryData(
        QUERY_KEYS.bookKeys.detail(isbn).queryKey,
        data.items[0],
      );
    }
  } catch {
    // API 호출 실패 시 조용한 실패 혹은 별도 처리 (여기서는 Hydration 생략)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookDetailView isbn={isbn} />
    </HydrationBoundary>
  );
}
