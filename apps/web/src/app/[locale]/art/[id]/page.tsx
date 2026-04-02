import { artKeys } from "@bookjeok/core";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

import { getArtDetail } from "@/features/art/apis";
import { DefaultLayout } from "@/layouts/default-layout";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { ArtDetailView } from "@/views/art-detail-view";

const getCachedArt = cache(async (id: string) => {
  try {
    return await getArtDetail(id);
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "art.metadata" });

  try {
    const art = await getCachedArt(id);

    if (!art) {
      return createPageMetadata({
        title: t("title"),
        description: t("description"),
      });
    }

    return createPageMetadata({
      title: art.prfnm,
      description: `${art.fcltynm} | ${art.prfpdfrom} ~ ${art.prfpdto}`,
      imageUrl: art.poster,
    });
  } catch {
    return createPageMetadata({
      title: t("title"),
      description: t("description"),
    });
  }
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
