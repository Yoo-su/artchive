import { getTranslations, setRequestLocale } from "next-intl/server";

import { LoungeView } from "@/views/lounge-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lounge.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LoungePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoungeView />;
}
