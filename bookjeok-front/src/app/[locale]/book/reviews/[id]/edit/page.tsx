import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthGuard } from "@/features/auth/components/guards/auth-guard";
import { ReviewEditView } from "@/views/review-edit-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "review.edit.metadata",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page() {
  return (
    <AuthGuard>
      <ReviewEditView />
    </AuthGuard>
  );
}
