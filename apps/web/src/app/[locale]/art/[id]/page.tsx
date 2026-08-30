import { getArtDetail } from "@bookjeok/api-client";
import { artKeys } from "@bookjeok/core";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

import { ArtJsonLd } from "@/features/art/components/common/art-json-ld";
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
        locale,
        path: `/art/${id}`,
      });
    }

    return createPageMetadata({
      title: art.prfnm,
      description: `${art.fcltynm} | ${art.prfpdfrom} ~ ${art.prfpdto}`,
      imageUrl: art.poster,
      locale,
      path: `/art/${id}`,
    });
  } catch {
    return createPageMetadata({
      title: t("title"),
      description: t("description"),
      locale,
      path: `/art/${id}`,
    });
  }
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // 캐시된 API 호출
  const art = await getCachedArt(id);

  const queries = [
    {
      queryKey: artKeys.detail(id).queryKey,
      queryFn: () => getArtDetail(id),
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      {art && <ArtJsonLd art={art} locale={locale} />}
      <DefaultLayout>
        <ArtDetailView artId={id} />
      </DefaultLayout>
    </ServerQueryBoundary>
  );
}
