import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

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

  const title = `${handle}님의 독서 카드 덱`;
  const description = `${year ? `${year}년` : "올해"} 완독한 소중한 책들의 카드 컬렉션을 둘러보세요.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
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
