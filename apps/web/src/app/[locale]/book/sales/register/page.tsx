import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthGuard } from "@/features/auth/components/guards/auth-guard";
import { createPageMetadata } from "@/shared/config/metadata";
import { BookSellView } from "@/views/book-sale-form-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "market.form" });
  const md = await getTranslations({
    locale,
    namespace: "market.hero.metadata",
  });

  return createPageMetadata({
    title: t("title_write"),
    description: md("description"),
  });
}

export default function Page() {
  return (
    <AuthGuard>
      <BookSellView />
    </AuthGuard>
  );
}
