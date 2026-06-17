"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Separator } from "@/shared/components/shadcn/separator";

import { useTrackBookVisit } from "../../hooks/use-track-book-visit";
import { useBookDetailQuery, useBookSummaryQuery } from "../../queries";
import { AISummary } from "./ai-summary";
import { BookActions } from "./book-actions";
import { BookCover } from "./book-cover";
import { BookDescription } from "./book-description";
import { BookInfo } from "./book-info";
import { BookDetailError } from "./error";
import { RelatedBooksSection } from "./related-books-section";
import { BookDetailSkeleton } from "./skeleton";

interface BookDetailProps {
  isbn: string;
}

export const BookDetail = ({ isbn }: BookDetailProps) => {
  const t = useTranslations();
  const {
    data: book,
    isLoading,
    isError,
  } = useBookDetailQuery(isbn);

  // 방문 트래킹 부수효과 (조회수 및 최근 본 도서 등록)
  useTrackBookVisit(isbn, book);
  const [isSummaryRequested, setIsSummaryRequested] = useState(false);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useBookSummaryQuery(
    book?.title || "",
    book?.author || "",
    !!book && isSummaryRequested,
    book?.description,
  );

  const handleRequestSummary = () => {
    setIsSummaryRequested(true);
  };

  if (isLoading) return <BookDetailSkeleton />;

  if (isError || !book) return <BookDetailError />;

  return (
    <section className="w-full">
      <div className="grid items-start md:grid-cols-3 gap-8 lg:gap-12">
        <div className="w-full md:col-span-1">
          <BookCover src={book.image} alt={book.title} />
        </div>

        <div className="flex flex-col h-full md:col-span-2">
          <BookInfo
            title={book.title}
            author={book.author}
            publisher={book.publisher}
            price={Number(book.discount)}
          />

          <div className="h-px bg-stone-100 my-6" />

          <BookActions isbn={isbn} />

          <div className="h-px bg-stone-100 my-6" />

          <BookDescription description={book.description} />
        </div>
      </div>

      <Separator className="my-8" />

      {book?.author && (
        <RelatedBooksSection
          title={t("book.detail.related_books_title", { author: book.author })}
          query={book.author}
          currentIsbn={isbn}
        />
      )}

      <Separator className="my-8" />
      <AISummary
        summary={summary}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
        onRequestSummary={handleRequestSummary}
        isRequested={isSummaryRequested}
      />
    </section>
  );
};
