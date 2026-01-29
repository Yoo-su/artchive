import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { WishlistView } from "@/views/wishlist-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wishlist.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page() {
  return <WishlistView />;
}
