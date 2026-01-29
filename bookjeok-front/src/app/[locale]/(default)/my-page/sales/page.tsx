import { Metadata } from "next";

import { BookSaleHistoryView } from "@/views/book-sale-history-view";

export const metadata: Metadata = {
  title: "판매 내역",
  description: "내가 등록한 중고 서적 판매 내역입니다.",
};

export default function Page() {
  return <BookSaleHistoryView />;
}
