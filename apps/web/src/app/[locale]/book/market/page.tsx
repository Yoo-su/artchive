import { bookSaleKeys } from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getBookSales, getPopularBookSales } from "@/features/book-sale/apis";
import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { BookMarketView } from "@/views/book-market-view";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "market.hero.metadata",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/book/market",
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "header" });

  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_market"), url: `/${locale}/book/market` },
  ];

  const queries = [
    {
      queryKey: bookSaleKeys.popularSales.queryKey,
      queryFn: getPopularBookSales,
    },
    {
      type: "infinite" as const,
      queryKey: bookSaleKeys.marketSales({}).queryKey,
      queryFn: ({ pageParam }: any) =>
        getBookSales({
          page: 1,
          cursor: pageParam as string | undefined,
        }),
      initialPageParam: undefined,
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <BookMarketView />
    </ServerQueryBoundary>
  );
}
