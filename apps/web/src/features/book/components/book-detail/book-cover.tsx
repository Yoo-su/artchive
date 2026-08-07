import Image from "next/image";

import { CometCard } from "@/shared/components/aceternityui/comet-card";
import { cn } from "@/shared/utils/cn";

interface BookCoverProps {
  src: string;
  alt: string;
  className?: string;
}

// 도서 상세 커버 이미지
export const BookCover = ({ src, alt, className }: BookCoverProps) => {
  return (
    <div className={cn("w-full overflow-visible p-2 sm:p-4", className)}>
      <CometCard className="w-full">
        <div className="relative overflow-hidden group aspect-3/4 rounded-2xl w-full">
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          />
          {/* 하단 그라디언트 */}
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </CometCard>
    </div>
  );
};
