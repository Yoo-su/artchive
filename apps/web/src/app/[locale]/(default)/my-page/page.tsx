import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { MyPageView } from "@/views/my-page-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "my_page.metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/my-page",
    noIndex: true,
  });
}

export default function Page() {
  return <MyPageView />;
}
