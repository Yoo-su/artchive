import { BookSaleEditView } from "@/views/book-sale-edit-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BookSaleEditView saleId={id} />;
}
