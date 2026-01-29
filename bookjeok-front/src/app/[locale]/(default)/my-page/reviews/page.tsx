import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import MyReviewsPage from "@/views/my-reviews-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "my_reviews.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page() {
  return <MyReviewsPage />;
}
