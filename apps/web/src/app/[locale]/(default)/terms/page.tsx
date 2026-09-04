import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { TermsView } from "@/views/terms-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const tMeta = await getTranslations({
    locale,
    namespace: "terms_page.metadata",
  });
  return createPageMetadata({
    title: tMeta("title"),
    description: tMeta("description"),
    locale,
    path: "/terms",
  });
}

export default function TermsPage() {
  return <TermsView />;
}
