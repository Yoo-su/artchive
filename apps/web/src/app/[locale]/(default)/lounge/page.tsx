import { readingLogKeys } from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getLoungeActiveReaders, getLoungePopular } from "@/features/reading-log/apis";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { LoungeView } from "@/views/lounge-view";

export const revalidate = 3600;

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

  const queries = [
    {
      queryKey: readingLogKeys.loungePopular.queryKey,
      queryFn: getLoungePopular,
    },
    {
      queryKey: readingLogKeys.loungeActiveReaders.queryKey,
      queryFn: getLoungeActiveReaders,
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <LoungeView />
    </ServerQueryBoundary>
  );
}
