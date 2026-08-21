import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { BookSaleHistoryView } from "@/views/book-sale-history-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "my_page.menu.sales.metadata",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/my-page/sales",
    noIndex: true,
  });
}

export default function Page() {
  return <BookSaleHistoryView />;
}
