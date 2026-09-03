import { getArtDetail } from "@bookjeok/api-client";
import { artKeys } from "@bookjeok/core";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

import { ArtJsonLd } from "@/features/art/components/common/art-json-ld";
import { DefaultLayout } from "@/layouts/default-layout";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { isNotFoundError } from "@/shared/utils/api-error";
import { ArtDetailView } from "@/views/art-detail-view";

// 공연 정보는 변동이 적어 24시간 캐시 (revalidate 누락 시 s-maxage 1년으로 고착)
export const revalidate = 86400;

// ISR 활성화용 빈 파라미터 목록
// - generateStaticParams가 없으면 Next가 Dynamic으로 분류해 revalidate를 무시
// - 빌드 타임 프리렌더 없이 첫 요청 시 생성 후 ISR 캐시에 등록 (dynamicParams 기본값 true)
export function generateStaticParams() {
  return [];
}

// 부재(404)만 null 반환, 일시적 API 장애는 재던짐 (JSON-LD 누락 페이지가 24시간 캐시되는 것 방지)
const getCachedArt = cache(async (id: string) => {
  try {
    return await getArtDetail(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
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
