import { getTranslations } from "next-intl/server";

import { ReadingLogView } from "@/views/reading-log-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "reading_log.hero.metadata",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function ReadingLogPage() {
  return <ReadingLogView />;
}
