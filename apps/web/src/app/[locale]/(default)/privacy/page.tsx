import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { PrivacyView } from "@/views/privacy-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const tMeta = await getTranslations({
    locale,
    namespace: "privacy_page.metadata",
  });
  return createPageMetadata({
    title: tMeta("title"),
    description: tMeta("description"),
  });
}

export default function PrivacyPage() {
  return <PrivacyView />;
}
