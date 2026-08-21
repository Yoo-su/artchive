import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { WishlistView } from "@/views/wishlist-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wishlist.metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/my-page/wishlist",
    noIndex: true,
  });
}

export default function Page() {
  return <WishlistView />;
}
