import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getPublicProfile } from "@/features/user/apis";
import { createPageMetadata } from "@/shared/config/metadata";
import { ShareDeckView } from "@/views/share-deck-view";

type Props = {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{ year?: string }>;
};

// 유저 핸들과 연도 쿼리 파라미터를 동적으로 처리하기 위해 정적 빌드에서 제외하고 dynamic 온디맨드로 처리합니다.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, handle } = await params;
  const { year } = await searchParams;
  const decodedHandle = decodeURIComponent(handle);

  let nickname = decodedHandle;
  try {
    const profile = await getPublicProfile(decodedHandle);
    if (profile?.nickname) {
      nickname = profile.nickname;
    }
  } catch {
    // 서버 조회 실패 시 폴백으로 URL 핸들 명칭 사용
  }

  const title = `${nickname}님의 독서 카드 덱`;
  const description = `${year ? `${year}년` : "올해"} 완독한 소중한 책들의 카드 컬렉션을 둘러보세요.`;

  return createPageMetadata({
    title,
    description,
    locale,
    path: `/share/deck/${encodeURIComponent(decodedHandle)}`,
  });
}

export default async function Page({ params, searchParams }: Props) {
  const { locale, handle } = await params;
  const { year } = await searchParams;
  setRequestLocale(locale);

  const displayYear = year ? parseInt(year) : new Date().getFullYear();

  return (
    <ShareDeckView
      handle={decodeURIComponent(handle)}
      year={displayYear}
    />
  );
}
