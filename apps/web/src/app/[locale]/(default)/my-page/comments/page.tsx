import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { MyCommentsView } from "@/views/my-comments-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "my_comments.metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    noIndex: true,
  });
}

export default function MyCommentsPage() {
  return <MyCommentsView />;
}
