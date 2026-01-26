"use client";

import Link from "next/link";

import { BookCard } from "@/features/book/components/common/book-card";
import { useBookListQuery } from "@/features/book/queries";

interface RelatedBooksSectionProps {
  title: string;
  query: string;
  currentIsbn: string;
}

export const RelatedBooksSection = ({
  title,
  query,
  currentIsbn,
}: RelatedBooksSectionProps) => {
  const { data: books, isLoading } = useBookListQuery({
    query,
    display: 6,
    sort: "sim",
  });

  const filteredBooks =
    books?.filter((book) => book.isbn !== currentIsbn) || [];

  if (!isLoading && filteredBooks.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h2>
        <Link
          href={`/book/search?q=${query}`}
          className="text-sm font-medium text-gray-500 hover:text-primary"
        >
          더보기
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <BookCard.Skeleton key={i} />
            ))
          : filteredBooks
              .slice(0, 5)
              .map((book) => <BookCard key={book.isbn} book={book} />)}
      </div>
    </section>
  );
};
