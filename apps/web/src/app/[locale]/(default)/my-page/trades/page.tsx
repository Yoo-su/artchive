import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { TradeHistoryView } from "@/views/trade-history-view";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "my_page.menu.trades.metadata",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/my-page/trades",
    noIndex: true,
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TradeHistoryView />;
}
