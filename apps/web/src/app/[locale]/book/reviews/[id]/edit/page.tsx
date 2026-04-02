import { getTranslations } from "next-intl/server";

import { AuthGuard } from "@/features/auth/components/guards/auth-guard";
import { createPageMetadata } from "@/shared/config/metadata";
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

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default function Page() {
  return (
    <AuthGuard>
      <ReviewEditView />
    </AuthGuard>
  );
}
