import { artKeys } from "@bookjeok/core";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { getArtDetail } from "@/features/art/apis";
import { DefaultLayout } from "@/layouts/default-layout";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { ArtDetailView } from "@/views/art-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "art.metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
  });
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const queries = [
    {
      queryKey: artKeys.detail(id).queryKey,
      queryFn: () => getArtDetail(id),
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <DefaultLayout>
        <ArtDetailView artId={id} />
      </DefaultLayout>
    </ServerQueryBoundary>
  );
}
