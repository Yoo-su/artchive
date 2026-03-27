import { UsedBookSale } from "@bookjeok/core/book-sale";

import { ShareButton } from "@/shared/components/ui/share-button";

interface BookSaleContentProps {
  sale: UsedBookSale;
}

/** 판매글 본문: 상세 설명 + 공유 버튼 */
export const BookSaleContent = ({ sale }: BookSaleContentProps) => {
  return (
    <>
      <div className="prose max-w-none text-gray-700 min-h-[200px] bg-gray-50/50 p-6 rounded-xl border border-gray-100">
        <p className="whitespace-pre-wrap leading-relaxed">{sale.content}</p>
      </div>

      {/* 공유 버튼 */}
      <div className="flex justify-end pt-4">
        <ShareButton
          title={sale.title}
          description={`${sale.book.title} | ${sale.price.toLocaleString()}원`}
          imageUrl={sale.imageUrls[0] || sale.book.image}
          showLabel
        />
      </div>
    </>
  );
};
