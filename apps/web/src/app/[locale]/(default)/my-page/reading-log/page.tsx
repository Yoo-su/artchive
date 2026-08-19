import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
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

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    noIndex: true,
  });
}

export default function ReadingLogPage() {
  return <ReadingLogView />;
}
