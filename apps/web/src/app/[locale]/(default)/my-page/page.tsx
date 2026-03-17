import { getTranslations } from "next-intl/server";

import { MyPageView } from "@/views/my-page-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "my_page.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page() {
  return <MyPageView />;
}
