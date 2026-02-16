import Image from "next/image";

import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { BookInfo } from "../../types";

interface BookCardProps {
  book: BookInfo;
}

// 도서 카드 - 이미지 배경 + 하단 오버레이 패턴
export const BookCard = ({ book }: BookCardProps) => {
  return (
    <Link href={PATHS.BOOK_DETAIL(book.isbn)} className="group block">
      <div className="relative w-full aspect-3/4 overflow-hidden bg-stone-100">
        <Image
          src={book.image.replace("?type=m1", "")}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* 하단 그라디언트 오버레이 */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />

        {/* 하단 정보 */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold text-white line-clamp-1 drop-shadow-sm">
            {book.title}
          </h3>
          <p className="mt-0.5 text-[10px] text-white/60 truncate">
            {book.author}
          </p>
        </div>
      </div>
    </Link>
  );
};

// 도서 카드 스켈레톤
BookCard.Skeleton = function BookCardSkeleton() {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative aspect-3/4 w-full bg-stone-100 animate-pulse">
        <div className="absolute inset-0 bg-linear-to-t from-stone-200/80 via-stone-100/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          <Skeleton className="h-4 w-3/4 bg-stone-200/50" />
          <Skeleton className="h-3 w-1/2 bg-stone-200/30" />
        </div>
      </div>
    </div>
  );
};
