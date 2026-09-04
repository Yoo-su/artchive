import { BookCard } from "../../common/book-card";

export const BookSearchResultListSkeleton = () => {
  return (
    <div className="grid gap-x-4 gap-y-6 grid-cols-2 sm:grid-cols-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <BookCard.Skeleton key={i} />
      ))}
    </div>
  );
};
