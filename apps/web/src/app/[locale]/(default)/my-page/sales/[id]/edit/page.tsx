import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { BookSaleEditView } from "@/views/book-sale-edit-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "market.form" });
  const md = await getTranslations({
    locale,
    namespace: "market.hero.metadata",
  });

  return createPageMetadata({
    title: t("title_edit"),
    description: md("description"),
    locale,
    path: `/my-page/sales/${id}/edit`,
    noIndex: true,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BookSaleEditView saleId={id} />;
}
