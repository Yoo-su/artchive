import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { artKeys } from "@/features/art";
import { getArtDetail } from "@/features/art/apis";
import { DefaultLayout } from "@/layouts/default-layout";
import { getQueryClient } from "@/shared/libs/query-client";
import { ArtDetailView } from "@/views/art-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "art.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const queryClient = getQueryClient();

  // 서버에서 공연/전시 상세 정보 prefetch
  try {
    await queryClient.prefetchQuery({
      queryKey: artKeys.detail(id).queryKey,
      queryFn: () => getArtDetail(id),
    });
  } catch (error) {
    console.error("공연/전시 상세 정보 프리패치 중 오류 발생:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DefaultLayout>
        <ArtDetailView artId={id} />
      </DefaultLayout>
    </HydrationBoundary>
  );
}
